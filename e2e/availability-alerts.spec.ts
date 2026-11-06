import { expect, test, type Page } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { Pool } from "pg";

const STUDENT_ID = "e2e-availability-alerts-student";
const STUDENT_EMAIL = "e2e-availability-alerts-student@example.test";
const hasPrerequisites = Boolean(
  process.env.AUTH_SECRET && process.env.DATABASE_URL,
);

function assertDisposableDatabase(databaseUrl: string) {
  const parsed = new URL(databaseUrl);
  const databaseName = decodeURIComponent(parsed.pathname.slice(1));
  if (
    !["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsed.hostname) ||
    !databaseName.endsWith("_test")
  ) {
    throw new Error(
      "Availability-alert E2E requires a loopback Postgres database with a _test name.",
    );
  }
}

type TestAlert = {
  id: string;
  type: "HOSTEL" | "SEARCH";
  hostelName?: string;
  criteria: Record<string, unknown>;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: "ACTIVE" | "PAUSED";
  isMatched: boolean;
};

async function mockAvailabilityAlerts(page: Page) {
  const alerts: TestAlert[] = [];
  let nextId = 1;
  await page.route("**/api/availability-alerts**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const id = decodeURIComponent(url.pathname.split("/").at(-1) ?? "");

    if (request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: alerts, total: alerts.length, hasMore: false }),
      });
      return;
    }

    if (request.method() === "POST") {
      const input = request.postDataJSON() as {
        type: "HOSTEL" | "SEARCH";
        hostelId?: string;
        criteria?: Record<string, unknown>;
        checkIn: string;
        checkOut: string;
        guests: number;
      };
      const alert: TestAlert = {
        id: `alert-${nextId++}`,
        type: input.type,
        ...(input.type === "HOSTEL" ? { hostelName: "Garden View Hostel" } : {}),
        criteria: input.type === "HOSTEL"
          ? { hostelId: input.hostelId }
          : input.criteria ?? {},
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        guests: input.guests,
        status: "ACTIVE",
        isMatched: false,
      };
      alerts.push(alert);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: alert }),
      });
      return;
    }

    const alert = alerts.find((candidate) => candidate.id === id);
    if (!alert) {
      await route.fulfill({ status: 404, body: JSON.stringify({ error: "Not found." }) });
      return;
    }

    if (request.method() === "PATCH") {
      const body = request.postDataJSON() as {
        active?: boolean;
        criteria?: {
          type: "HOSTEL" | "SEARCH";
          hostelId?: string;
          criteria?: Record<string, unknown>;
          checkIn: string;
          checkOut: string;
          guests: number;
        };
      };
      if (body.active !== undefined) {
        alert.status = body.active ? "ACTIVE" : "PAUSED";
      }
      if (body.criteria) {
        alert.type = body.criteria.type;
        alert.criteria = body.criteria.type === "HOSTEL"
          ? { hostelId: body.criteria.hostelId }
          : body.criteria.criteria ?? {};
        alert.checkIn = body.criteria.checkIn;
        alert.checkOut = body.criteria.checkOut;
        alert.guests = body.criteria.guests;
        alert.status = "ACTIVE";
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: alert }),
      });
      return;
    }

    if (request.method() === "DELETE") {
      alerts.splice(alerts.indexOf(alert), 1);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Alert deleted." }),
      });
      return;
    }

    await route.fulfill({ status: 405 });
  });
}

test.skip(
  !hasPrerequisites,
  "Set AUTH_SECRET and a disposable loopback DATABASE_URL ending in _test to run signed-in availability-alert cases.",
);

let pool: Pool;

test.beforeAll(async () => {
  const databaseUrl = process.env.DATABASE_URL as string;
  assertDisposableDatabase(databaseUrl);
  pool = new Pool({ connectionString: databaseUrl });
  await pool.query(
    `INSERT INTO users (id, email, name, role, "tokenVersion", "updatedAt")
     VALUES ($1, $2, 'E2E Availability Alerts Student', 'STUDENT', 0, now())
     ON CONFLICT (id) DO UPDATE
       SET role = 'STUDENT', "tokenVersion" = 0, "deletionRequestedAt" = NULL`,
    [STUDENT_ID, STUDENT_EMAIL],
  );
});

test.afterAll(async () => {
  if (!pool) return;
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
      name: "E2E Availability Alerts Student",
    },
    secret: process.env.AUTH_SECRET as string,
    salt: cookieName,
  });

  await context.addCookies([
    { name: cookieName, value: sessionToken, url: baseURL as string },
  ]);
});

test("creates, pauses, edits, and deletes a HOSTEL alert", async ({ page }) => {
  await mockAvailabilityAlerts(page);
  await page.goto(
    "/student/availability-alerts?type=HOSTEL&hostelId=hostel_1&checkIn=2099-04-10&checkOut=2099-04-12&guests=2",
  );

  await page.getByRole("button", { name: "Create alert" }).click();
  const alert = page.getByRole("listitem").filter({ hasText: "Specific hostel" });
  await expect(alert).toContainText("Garden View Hostel");
  await alert.getByRole("button", { name: "Pause" }).click();
  await expect(alert.getByRole("button", { name: "Resume" })).toBeVisible();
  await alert.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Check-in").fill("2099-04-11");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Alert updated.")).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await alert.getByRole("button", { name: "Delete" }).click();
  await expect(
    page.getByRole("heading", { name: "Availability alerts", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "You don’t have any availability alerts.",
      exact: true,
    }),
  ).toBeVisible();
});

test("creates, pauses, edits, and deletes a SEARCH alert", async ({ page }) => {
  await mockAvailabilityAlerts(page);
  await page.goto(
    "/student/availability-alerts?type=SEARCH&city=Lahore&gender=FEMALE&amenities=wifi&checkIn=2099-04-10&checkOut=2099-04-12&guests=2",
  );

  await page.getByRole("button", { name: "Create alert" }).click();
  const alert = page.getByRole("listitem").filter({ hasText: "Saved search" });
  await expect(alert).toContainText("Lahore");
  await alert.getByRole("button", { name: "Pause" }).click();
  await expect(alert.getByRole("button", { name: "Resume" })).toBeVisible();
  await alert.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Check-out").fill("2099-04-13");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Alert updated.")).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await alert.getByRole("button", { name: "Delete" }).click();
  await expect(
    page.getByRole("heading", { name: "Availability alerts", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "You don’t have any availability alerts.",
      exact: true,
    }),
  ).toBeVisible();
});
