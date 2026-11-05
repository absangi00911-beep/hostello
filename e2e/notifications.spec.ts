import { expect, test, type Page } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { Pool } from "pg";

const STUDENT_ID = "e2e-notifications-student";
const STUDENT_EMAIL = "e2e-notifications-student@example.test";
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
      "Notification E2E requires a loopback Postgres database with a _test name.",
    );
  }
}

type TestNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  bookingId: string | null;
  hostelId: string | null;
};

function makeNotifications(): TestNotification[] {
  return Array.from({ length: 21 }, (_, index) => ({
    id: `notification-${index + 1}`,
    type:
      index === 0
        ? "BOOKING_CONFIRMED"
        : index === 1
          ? "UNKNOWN_TYPE"
          : "PRICE_ALERT",
    title: `Notification ${index + 1}`,
    message: `Message ${index + 1}`,
    read: false,
    createdAt: new Date(Date.UTC(2026, 10, 5, 12, 0, index)).toISOString(),
    bookingId: index < 2 ? `booking-${index + 1}` : null,
    hostelId: index === 1 ? "//external.example/path" : `hostel-${index + 1}`,
  }));
}

async function mockNotifications(
  page: Page,
  options: {
    delayFirstPage?: boolean;
    empty?: boolean;
    failFirstRead?: boolean;
    stalePagination?: boolean;
  } = {},
) {
  const notifications = options.empty ? [] : makeNotifications();
  let shouldFailFirstRead = options.failFirstRead ?? false;

  await page.route("**/api/notifications**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === "GET") {
      const requestedPage = Number(url.searchParams.get("page") ?? 1);
      const limit = Number(url.searchParams.get("limit") ?? 20);
      if (options.stalePagination && requestedPage > 1) {
        notifications.pop();
      }
      if (options.delayFirstPage && requestedPage === 1 && limit === 20) {
        await new Promise((resolve) => setTimeout(resolve, 700));
      }

      const start = (requestedPage - 1) * limit;
      const data = notifications.slice(start, start + limit);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data,
          unreadCount: notifications.filter((item) => !item.read).length,
          total: notifications.length,
          page: requestedPage,
          limit,
          hasMore: start + data.length < notifications.length,
        }),
      });
      return;
    }

    if (request.method() === "PUT" && url.pathname === "/api/notifications") {
      for (const notification of notifications) notification.read = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "All notifications marked as read." }),
      });
      return;
    }

    const id = decodeURIComponent(url.pathname.split("/").at(-1) ?? "");
    const notification = notifications.find((item) => item.id === id);
    if (!notification) {
      await route.fulfill({ status: 404, body: JSON.stringify({ error: "Not found." }) });
      return;
    }

    if (request.method() === "PUT") {
      if (shouldFailFirstRead && id === "notification-1") {
        shouldFailFirstRead = false;
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Could not mark as read." }),
        });
        return;
      }
      notification.read = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Notification marked as read." }),
      });
      return;
    }

    if (request.method() === "DELETE") {
      notifications.splice(notifications.indexOf(notification), 1);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Notification deleted." }),
      });
      return;
    }

    await route.fulfill({ status: 405 });
  });
}

test.skip(
  !hasPrerequisites,
  "Set AUTH_SECRET and a disposable loopback DATABASE_URL ending in _test to run signed-in notification cases.",
);

let pool: Pool;

test.beforeAll(async () => {
  const databaseUrl = process.env.DATABASE_URL as string;
  assertDisposableDatabase(databaseUrl);

  pool = new Pool({ connectionString: databaseUrl });
  await pool.query(
    `INSERT INTO users (id, email, name, role, "tokenVersion", "updatedAt")
     VALUES ($1, $2, 'E2E Notification Student', 'STUDENT', 0, now())
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
      name: "E2E Notification Student",
    },
    secret: process.env.AUTH_SECRET as string,
    salt: cookieName,
  });

  await context.addCookies([
    { name: cookieName, value: sessionToken, url: baseURL as string },
  ]);
});

test("shows loading and the approved empty notification state", async ({ page }) => {
  await mockNotifications(page, { delayFirstPage: true, empty: true });
  await page.goto("/notifications");

  await expect(page.getByText("Loading notifications...")).toBeVisible();
  await expect(page.getByRole("status").last()).toContainText("You’re all caught up.");
  await expect(page.getByText("You’re all caught up.", { exact: true })).toBeVisible();
});

test("supports pagination and confirms read-all and delete actions", async ({
  page,
}) => {
  await mockNotifications(page);
  await page.goto("/notifications");

  await expect(page.getByRole("status").first()).toContainText("21 unread");
  await expect(page.getByTestId("unread-badge")).toHaveText("21");
  await expect(
    page.getByRole("link", { name: "View notification: Notification 1" }),
  ).toHaveAttribute("href", "/trips");

  const unknownNotification = page
    .getByRole("listitem")
    .filter({ has: page.getByText("Notification 2", { exact: true }) });
  await expect(unknownNotification.getByRole("link")).toHaveCount(0);

  await page.getByRole("button", { name: "Mark all as read" }).click();
  await expect(page.getByRole("status").first()).toContainText("You’re all caught up.");
  await expect(
    page.getByRole("listitem").first().getByText("Read", { exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Load more" }).click();
  await expect(page.getByText("Notification 21", { exact: true })).toBeVisible();
  await expect(page.getByRole("status").last()).toContainText("1 more notification");

  await page
    .getByRole("button", {
      name: "Delete notification: Notification 1",
      exact: true,
    })
    .click();
  await expect(page.getByText("Notification 1", { exact: true })).toHaveCount(0);

  const markAllButton = page.getByRole("button", { name: "Mark all as read" });
  expect((await markAllButton.boundingBox())?.height).toBeGreaterThanOrEqual(44);
});

test("refreshes the last visible page when pagination becomes stale", async ({
  page,
}) => {
  await mockNotifications(page, { stalePagination: true });
  await page.goto("/notifications");

  await expect(page.getByRole("button", { name: "Load more" })).toBeVisible();
  await page.getByRole("button", { name: "Load more" }).click();

  await expect(page.getByRole("status").last()).toContainText(
    "Notifications have changed. The current page has been refreshed.",
  );
  await expect(page.getByText("Notification 20", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Load more" })).toHaveCount(0);
});

test("retains unread state on failure and offers a working retry", async ({
  page,
}) => {
  await mockNotifications(page, { failFirstRead: true });
  await page.goto("/notifications");

  const firstNotification = page
    .getByRole("listitem")
    .filter({ has: page.getByText("Notification 1", { exact: true }) });
  const markReadButton = firstNotification.getByRole("button", {
    name: "Mark notification as read: Notification 1",
  });
  expect((await markReadButton.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await markReadButton.click();

  await expect(page.getByRole("alert")).toContainText("Could not mark as read.");
  await expect(firstNotification.getByText("Unread", { exact: true })).toBeVisible();
  await expect(page.getByRole("status").first()).toContainText("21 unread");

  await page
    .getByRole("button", { name: "Retry: Mark notification as read" })
    .click();
  await expect(firstNotification.getByText("Read", { exact: true })).toBeVisible();
  await expect(page.getByRole("status").first()).toContainText("20 unread");
  await expect(page.getByRole("alert")).toHaveCount(0);
});
