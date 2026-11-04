import { expect, test } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { Pool } from "pg";

// Role-guard coverage for the server-rendered pages. These tests describe what
// the code does today (see the per-page `auth()` checks under src/app):
//
//   guest                      -> /login?callbackUrl=<requested path>
//   student on owner/admin page -> the not-found page, at the SAME url
//                                  (the pages call notFound(), not redirect())
//
// The student cases need a real session. They seed a disposable STUDENT row
// and mint an Auth.js session cookie with AUTH_SECRET, so they only run when
// AUTH_SECRET and a local DATABASE_URL are provided (see .env.e2e.example).

const NOT_FOUND_TITLE = "We can't find that page";

const studentPages = [
  "/wishlists",
  "/trips",
  "/profile",
  "/profile/verification",
];

// Pages any signed-in role may use; guests are still sent to login.
const sharedAccountPages = ["/messages", "/notifications", "/bookings/e2e-booking"];

const ownerPages = [
  "/owner",
  "/owner/bookings",
  "/owner/earnings",
  "/owner/reviews",
  "/owner/subscription",
  "/owner/analytics",
  "/owner/listings/new",
];

const adminPages = [
  "/admin",
  "/admin/listings",
  "/admin/payment-events",
  "/admin/payouts",
  "/admin/refunds",
  "/admin/roommate-reports",
  "/admin/search-sync",
  "/admin/verifications",
];

// First hit on each route compiles it in `next dev`, which can be slow.
test.describe.configure({ timeout: 120_000 });

test.describe("guest access to protected pages", () => {
  const protectedPages = [
    ...studentPages,
    ...sharedAccountPages,
    ...ownerPages,
    ...adminPages,
  ];

  for (const path of protectedPages) {
    test(`guest_visiting_${path}_is_sent_to_login_with_a_callback_url`, async ({
      page,
    }) => {
      await page.goto(path);

      // The redirect is streamed after the page shell (app/loading.tsx), so it
      // lands client-side; wait for the final URL rather than a status code.
      await page.waitForURL(/\/login\?/);

      const landed = new URL(page.url());
      expect(landed.pathname).toBe("/login");
      expect(landed.searchParams.get("callbackUrl")).toBe(path);

      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Login or Signup" }),
      ).toBeVisible();
      await expect(page.getByText(NOT_FOUND_TITLE)).toHaveCount(0);
    });
  }
});

const STUDENT_ID = "e2e-role-student";
const STUDENT_EMAIL = "e2e-role-student@example.test";
const hasStudentPrerequisites = Boolean(
  process.env.AUTH_SECRET && process.env.DATABASE_URL,
);

function assertDisposableDatabase(databaseUrl: string) {
  const { hostname } = new URL(databaseUrl);
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname)) {
    throw new Error(
      `Refusing to seed an e2e user into a non-local database (${hostname}). ` +
        "Point DATABASE_URL at a disposable local Postgres.",
    );
  }
}

test.describe("student access to owner and admin pages", () => {
  test.skip(
    !hasStudentPrerequisites,
    "Set AUTH_SECRET and a local DATABASE_URL to run the signed-in student cases.",
  );

  let pool: Pool;

  test.beforeAll(async () => {
    const databaseUrl = process.env.DATABASE_URL as string;
    assertDisposableDatabase(databaseUrl);

    pool = new Pool({ connectionString: databaseUrl });
    await pool.query(
      `INSERT INTO users (id, email, name, role, "tokenVersion", "updatedAt")
       VALUES ($1, $2, 'E2E Role Student', 'STUDENT', 0, now())
       ON CONFLICT (id) DO UPDATE
         SET role = 'STUDENT', "tokenVersion" = 0, "deletionRequestedAt" = NULL`,
      [STUDENT_ID, STUDENT_EMAIL],
    );
  });

  test.afterAll(async () => {
    try {
      await pool.query("DELETE FROM users WHERE id = $1", [STUDENT_ID]);
    } finally {
      await pool.end();
    }
  });

  test.beforeEach(async ({ context, baseURL }) => {
    const secure = new URL(baseURL as string).protocol === "https:";
    const cookieName = secure
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    const sessionToken = await encode({
      token: {
        sub: STUDENT_ID,
        id: STUDENT_ID,
        role: "STUDENT",
        tokenVersion: 0,
        emailVerified: null,
        email: STUDENT_EMAIL,
        name: "E2E Role Student",
      },
      secret: process.env.AUTH_SECRET as string,
      salt: cookieName,
    });

    await context.addCookies([
      { name: cookieName, value: sessionToken, url: baseURL as string },
    ]);
  });

  test("student_session_is_accepted_on_a_student_page", async ({ page }) => {
    await page.goto("/trips");

    // Control case: if the cookie were rejected this would go to /login, and
    // the not-found assertions below would not prove anything about roles.
    await expect(page).toHaveURL(/\/trips$/);
    await expect(page.getByText(NOT_FOUND_TITLE)).toHaveCount(0);
    await expect(page.getByText("E2E Role Student").first()).toBeVisible();
  });

  for (const path of [...ownerPages, ...adminPages]) {
    test(`student_visiting_${path}_gets_the_not_found_page_without_a_redirect`, async ({
      page,
    }) => {
      await page.goto(path);

      await expect(page.getByText(NOT_FOUND_TITLE)).toBeVisible();

      // notFound() keeps the URL; nothing sends the student to login or home.
      const landed = new URL(page.url());
      expect(landed.pathname).toBe(path);
      expect(landed.searchParams.has("callbackUrl")).toBe(false);
      await expect(page.getByRole("dialog")).toHaveCount(0);
    });
  }
});
