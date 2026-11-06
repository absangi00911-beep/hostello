import { randomUUID } from "node:crypto";
import nextEnv from "@next/env";
import { encode } from "next-auth/jwt";
import { Pool } from "pg";
import { expect, test, type Page } from "@playwright/test";

const { loadEnvConfig } = nextEnv;

const hasPrerequisites = Boolean(
  process.env.AUTH_SECRET && process.env.DATABASE_URL,
);
const fixtureSuffix = randomUUID();
const ownerId = `e2e-owner-${fixtureSuffix}`;
const studentConfirmId = `e2e-student-confirm-${fixtureSuffix}`;
const studentDeclineId = `e2e-student-decline-${fixtureSuffix}`;
const otherOwnerId = `e2e-owner-other-${fixtureSuffix}`;
const hostelId = `e2e-hostel-${fixtureSuffix}`;
const otherHostelId = `e2e-hostel-other-${fixtureSuffix}`;
const roomId = `e2e-room-${fixtureSuffix}`;
const otherRoomId = `e2e-room-other-${fixtureSuffix}`;
const confirmBookingId = `e2e-booking-confirm-${fixtureSuffix}`;
const declineBookingId = `e2e-booking-decline-${fixtureSuffix}`;
const ownerEmail = `${ownerId}@example.test`;
const studentConfirmEmail = `${studentConfirmId}@example.test`;
const studentDeclineEmail = `${studentDeclineId}@example.test`;
const otherOwnerEmail = `${otherOwnerId}@example.test`;
const listingName = `E2E Owner Hostel ${fixtureSuffix.slice(0, 8)}`;
const otherListingName = `E2E Other Owner Hostel ${fixtureSuffix.slice(0, 8)}`;
const confirmStudentName = "E2E Student Confirm";
const declineStudentName = "E2E Student Decline";
const checkIn = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
const checkOut = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
const createdAt = new Date();
const responseDueAt = new Date(Date.now() + 23 * 60 * 60 * 1000);

function assertDisposableDatabase(databaseUrl: string) {
  const parsed = new URL(databaseUrl);
  const databaseName = decodeURIComponent(parsed.pathname.slice(1));
  if (
    !["postgres:", "postgresql:"].includes(parsed.protocol) ||
    !["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsed.hostname) ||
    !databaseName.endsWith("_test")
  ) {
    throw new Error(
      "Owner workflow E2E requires a loopback PostgreSQL database whose name ends in _test.",
    );
  }
}

function assertLoopbackBaseURL(baseURL: string) {
  const parsed = new URL(baseURL);
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    !["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsed.hostname)
  ) {
    throw new Error(
      "Owner workflow E2E requires a loopback PLAYWRIGHT_BASE_URL.",
    );
  }
}

function hasRemoteRedisConfiguration() {
  // Match Next dev's dotenv precedence without making dotenv-only settings
  // available to the Playwright runner (or treating .env.e2e as a server
  // fallback). Existing process env values, including explicit empty values,
  // retain precedence just as they do in Next.
  const originalEnv = { ...process.env };
  try {
    const { combinedEnv } = loadEnvConfig(
      process.cwd(),
      true,
      { info() {}, error: (...args: unknown[]) => console.error(...args) },
    );
    const redisUrl = combinedEnv.UPSTASH_REDIS_REST_URL;
    const redisToken = combinedEnv.UPSTASH_REDIS_REST_TOKEN;
    if (!redisUrl || !redisToken) return false;

    let hostname: string;
    try {
      hostname = new URL(redisUrl).hostname;
    } catch {
      return true;
    }
    return !["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname);
  } finally {
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
  }
}

const remoteRedisConfiguration = hasRemoteRedisConfiguration();

test.skip(
  remoteRedisConfiguration,
  "Owner workflow E2E skipped before fixture setup because effective Next dev Redis configuration is not loopback.",
);
test.skip(
  !hasPrerequisites,
  "Set AUTH_SECRET and a disposable loopback DATABASE_URL ending in _test to run owner workflow cases.",
);

let pool: Pool | undefined;

test.beforeAll(async () => {
  const databaseUrl = process.env.DATABASE_URL as string;
  assertDisposableDatabase(databaseUrl);
  pool = new Pool({ connectionString: databaseUrl });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO users (id, email, name, role, "tokenVersion", "updatedAt")
       VALUES
         ($1, $2, 'E2E Owner', 'OWNER', 0, now()),
         ($3, $4, 'E2E Student Confirm', 'STUDENT', 0, now()),
       ($5, $6, 'E2E Student Decline', 'STUDENT', 0, now()),
       ($7, $8, 'E2E Other Owner', 'OWNER', 0, now())`,
      [
        ownerId,
        ownerEmail,
        studentConfirmId,
        studentConfirmEmail,
        studentDeclineId,
        studentDeclineEmail,
        otherOwnerId,
        otherOwnerEmail,
      ],
    );
    await client.query(
      `INSERT INTO hostels (
         id, name, slug, description, status, city, area, address,
         "pricePerMonth", rooms, capacity, gender, "cancellationPolicy",
         amenities, rules, images, "ownerId", "createdAt", "updatedAt"
       )
       VALUES (
         $1, $2, $3,
         'A seeded owner listing for browser tests with enough detail to satisfy the listing form.',
         'PENDING_REVIEW', 'Lahore', 'Gulberg', 'E2E fixture address, Lahore',
         12000, 1, 2, 'MIXED', 'STANDARD',
         ARRAY['wifi'], ARRAY['Quiet hours after 10 PM'], ARRAY[]::text[],
         $4, now(), now()
       )`,
      [hostelId, listingName, `e2e-owner-${fixtureSuffix}`, ownerId],
    );
    await client.query(
      `INSERT INTO hostels (
         id, name, slug, description, status, city, area, address,
         "pricePerMonth", rooms, capacity, gender, "cancellationPolicy",
         amenities, rules, images, "ownerId", "createdAt", "updatedAt"
       )
       VALUES (
         $1, $2, $3,
         'A separate E2E listing owned by a different owner for access-control browser tests.',
         'PENDING_REVIEW', 'Lahore', 'Gulberg', 'Different E2E fixture address, Lahore',
         14000, 1, 2, 'MIXED', 'STANDARD',
         ARRAY['wifi'], ARRAY[]::text[], ARRAY[]::text[],
         $4, now(), now()
       )`,
      [
        otherHostelId,
        otherListingName,
        `e2e-other-owner-${fixtureSuffix}`,
        otherOwnerId,
      ],
    );
    await client.query(
      `INSERT INTO rooms (
         id, "hostelId", name, description, "pricePerMonth", capacity,
         available, version, images, facilities, "createdAt", "updatedAt"
       )
       VALUES (
         $1, $2, 'Existing two-bed room', 'Seed room for editing.',
         12000, 2, 2, 0, ARRAY[]::text[], ARRAY['Study desk'], now(), now()
       )`,
      [roomId, hostelId],
    );
    await client.query(
      `INSERT INTO rooms (
         id, "hostelId", name, description, "pricePerMonth", capacity,
         available, version, images, facilities, "createdAt", "updatedAt"
       )
       VALUES (
         $1, $2, 'Other owner original room', 'Must remain unchanged.',
         14000, 2, 2, 0, ARRAY[]::text[], ARRAY[]::text[], now(), now()
       )`,
      [otherRoomId, otherHostelId],
    );
    await client.query(
      `INSERT INTO bookings (
         id, "hostelId", "roomId", "userId", "checkIn", "checkOut",
         months, guests, total, "paymentStatus", status,
         "ownerResponseDueAt", "createdAt", "updatedAt"
       )
       VALUES
         ($1, $2, $3, $4, $5, $6, 1, 1, 12000, 'PAID', 'PENDING', $7, $8, now()),
         ($9, $2, $3, $10, $5, $6, 1, 1, 12000, 'PAID', 'PENDING', $7, $8, now())`,
      [
        confirmBookingId,
        hostelId,
        roomId,
        studentConfirmId,
        checkIn,
        checkOut,
        responseDueAt,
        createdAt,
        declineBookingId,
        studentDeclineId,
      ],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});

test.afterAll(async () => {
  if (!pool) return;
  const cleanupErrors: unknown[] = [];
  const cleanupStatements: Array<[string, unknown[]]> = [
    [
      `DELETE FROM bookings WHERE id = ANY($1::text[])`,
      [[confirmBookingId, declineBookingId]],
    ],
    [
      `DELETE FROM rooms WHERE id = ANY($1::text[])`,
      [[roomId, otherRoomId]],
    ],
    [
      `DELETE FROM hostels
       WHERE (id = $1 AND "ownerId" = $2) OR (id = $3 AND "ownerId" = $4)`,
      [hostelId, ownerId, otherHostelId, otherOwnerId],
    ],
    [
      `DELETE FROM users WHERE id = ANY($1::text[])`,
      [[ownerId, studentConfirmId, studentDeclineId, otherOwnerId]],
    ],
  ];

  try {
    for (const [statement, values] of cleanupStatements) {
      try {
        await pool.query(statement, values);
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
  } finally {
    await pool.end();
  }

  if (cleanupErrors.length > 0) {
    throw new AggregateError(cleanupErrors, "Could not clean up all owner workflow fixtures.");
  }
});

test.beforeEach(async ({ context, baseURL }) => {
  assertLoopbackBaseURL(baseURL as string);
  const origin = new URL(baseURL as string).origin;
  const secure = new URL(baseURL as string).protocol === "https:";
  const cookieName = secure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
  const sessionToken = await encode({
    token: {
      sub: ownerId,
      id: ownerId,
      role: "OWNER",
      tokenVersion: 0,
      emailVerified: null,
      email: ownerEmail,
      name: "E2E Owner",
    },
    secret: process.env.AUTH_SECRET as string,
    salt: cookieName,
  });

  await context.addCookies([
    { name: cookieName, value: sessionToken, url: baseURL as string },
  ]);
  await context.route("**/*", async (route) => {
    if (new URL(route.request().url()).origin === origin) {
      await route.continue();
    } else {
      await route.abort();
    }
  });
});

async function fillNewListing(page: Page) {
  await page.getByLabel("Hostel name").fill(`E2E New Hostel ${fixtureSuffix.slice(0, 8)}`);
  await page
    .getByLabel("Description", { exact: true })
    .fill("A comfortable and well-maintained hostel close to university and public transport.");
  await page.getByLabel("Boys").check();
  await page.getByLabel("City").selectOption({ label: "Lahore" });
  await page.getByLabel("Area (optional)").fill("Johar Town");
  await page.getByLabel("Full address").fill("E2E Test Road, Lahore");
  await page.getByLabel("Room name").fill("Two-bed room");
  await page.getByLabel("Price per month (Rs.)").fill("15000");
  await page.getByLabel("Beds in this room type").fill("2");
  await page.getByLabel("Wi-Fi").check();
  await page.getByRole("radio", { name: /^Flexible/ }).check();
}

test("owner submits a listing with its first room", async ({ page }) => {
  let submittedPayload: Record<string, unknown> | undefined;
  // Keep the create flow at the browser/API boundary: the real handler sends
  // an admin notification, so this test must not reach an email provider.
  await page.route("**/api/hostels", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    submittedPayload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        data: { id: `e2e-created-listing-${fixtureSuffix}`, status: "PENDING_REVIEW" },
        message: "Listing submitted for review.",
      }),
    });
  });

  await page.goto("/owner/listings/new");
  await fillNewListing(page);
  await page.getByRole("button", { name: "Submit for review" }).click();

  await expect(page.getByRole("status")).toContainText("Listing submitted for review");
  expect(submittedPayload).toMatchObject({
    name: `E2E New Hostel ${fixtureSuffix.slice(0, 8)}`,
    city: "Lahore",
    pricePerMonth: 15000,
    rooms: 1,
    capacity: 2,
    roomTypes: [
      {
        name: "Two-bed room",
        pricePerMonth: 15000,
        capacity: 2,
        facilities: [],
        images: [],
      },
    ],
  });
});

test("owner edits and adds rooms on their own listing", async ({ page }) => {
  let editedPayload: Record<string, unknown> | undefined;
  // The actual edit handler may contact search/alert integrations; verify the
  // owner form payload without invoking those services.
  await page.route(`**/api/hostels/${hostelId}`, async (route) => {
    if (route.request().method() !== "PATCH") {
      await route.continue();
      return;
    }
    editedPayload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: { id: hostelId, name: listingName, status: "PENDING_REVIEW" },
        message: "Listing updated and submitted for review.",
      }),
    });
  });

  await page.goto(`/owner/listings/${hostelId}/edit`);
  await expect(page.getByRole("heading", { name: "Edit listing" })).toBeVisible();
  await expect(page.getByLabel("Room name").first()).toHaveValue("Existing two-bed room");
  await page.getByLabel("Room name").first().fill("Updated two-bed room");
  await page.getByLabel("Price per month (Rs.)").first().fill("13500");
  await page.getByRole("button", { name: "Add another room type" }).click();
  await page.getByLabel("Room name").nth(1).fill("New four-bed room");
  await page.getByLabel("Price per month (Rs.)").nth(1).fill("11000");
  await page.getByLabel("Beds in this room type").nth(1).fill("4");
  await page.getByRole("button", { name: "Save and submit for review" }).click();

  await expect(page.getByRole("status")).toContainText("Changes saved and submitted for review");
  expect(editedPayload).toMatchObject({
    name: listingName,
    roomTypes: [
      {
        id: roomId,
        name: "Updated two-bed room",
        pricePerMonth: 13500,
        capacity: 2,
      },
      {
        name: "New four-bed room",
        pricePerMonth: 11000,
        capacity: 4,
      },
    ],
  });
});

test("owner cannot view or mutate another owner's listing", async ({ page, baseURL }) => {
  await page.goto(`/owner/listings/${otherHostelId}/edit`);
  await expect(page.getByText(otherListingName, { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Edit listing" })).toHaveCount(0);
  await expect(page.getByLabel("Hostel name")).toHaveCount(0);
  await expect(page.getByLabel("Room name")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Save and submit for review" }),
  ).toHaveCount(0);

  const mutation = await page.request.patch(
    `${new URL(baseURL as string).origin}/api/hostels/${otherHostelId}`,
    {
      headers: { "Content-Type": "application/json" },
      data: {
        name: `Unauthorized edit ${fixtureSuffix.slice(0, 8)}`,
        description:
          "An attempted edit with a sufficiently long description for the listing validation schema.",
        city: "Lahore",
        area: "Gulberg",
        address: "Attempted E2E address, Lahore",
        pricePerMonth: 10000,
        rooms: 1,
        capacity: 1,
        gender: "MIXED",
        cancellationPolicy: "STANDARD",
        minStay: 1,
        amenities: ["wifi"],
        rules: [],
        images: [],
        roomTypes: [
          {
            id: otherRoomId,
            name: "Unauthorized room edit",
            pricePerMonth: 10000,
            capacity: 1,
            facilities: [],
            images: [],
          },
        ],
      },
    },
  );
  expect([403, 404]).toContain(mutation.status());

  const listing = await pool?.query(
    `SELECT h.name, r.name AS "roomName", r."pricePerMonth", r.capacity
     FROM hostels h JOIN rooms r ON r."hostelId" = h.id
     WHERE h.id = $1 AND h."ownerId" = $2 AND r.id = $3`,
    [otherHostelId, otherOwnerId, otherRoomId],
  );
  expect(listing?.rows).toEqual([
    {
      name: otherListingName,
      roomName: "Other owner original room",
      pricePerMonth: 14000,
      capacity: 2,
    },
  ]);
});

test("owner confirms a paid booking and declines another after confirmation", async ({
  page,
}) => {
  const bookingActions: Array<{ id: string; action: string }> = [];
  const bookingPayload = [
    {
      id: confirmBookingId,
      status: "PENDING",
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      months: 1,
      guests: 1,
      total: 12000,
      createdAt: createdAt.toISOString(),
      ownerResponseDueAt: responseDueAt.toISOString(),
      paymentStatus: "PAID",
      hostel: { id: hostelId, name: listingName, slug: `e2e-owner-${fixtureSuffix}` },
      user: { id: studentConfirmId, name: confirmStudentName, email: null, phone: null },
    },
    {
      id: declineBookingId,
      status: "PENDING",
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      months: 1,
      guests: 1,
      total: 12000,
      createdAt: createdAt.toISOString(),
      ownerResponseDueAt: responseDueAt.toISOString(),
      paymentStatus: "PAID",
      hostel: { id: hostelId, name: listingName, slug: `e2e-owner-${fixtureSuffix}` },
      user: { id: studentDeclineId, name: declineStudentName, email: null, phone: null },
    },
  ];

  // Booking decisions are UI/API-contract coverage only. In particular,
  // declining is intercepted so no refund provider is contacted.
  await page.route("**/api/bookings**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "GET" && url.pathname === "/api/bookings") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: bookingPayload,
          total: bookingPayload.length,
          page: 1,
          limit: 20,
          hasMore: false,
        }),
      });
      return;
    }
    if (request.method() === "PATCH" && url.pathname.startsWith("/api/bookings/")) {
      const id = url.pathname.split("/").at(-1) ?? "";
      const body = request.postDataJSON() as { action: string };
      bookingActions.push({ id, action: body.action });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id,
            status: body.action === "confirm" ? "CONFIRMED" : "CANCELLED",
            paymentStatus: "PAID",
            refundState: body.action === "decline" ? "UNCERTAIN" : "NONE",
          },
          message:
            body.action === "confirm"
              ? "Booking confirmed."
              : "Booking declined. Refund needs reconciliation.",
        }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto("/owner/bookings");
  await expect(page.getByRole("listitem")).toHaveCount(2);
  const confirmCard = page
    .getByRole("listitem")
    .filter({ hasText: confirmStudentName });
  await confirmCard.getByRole("button", { name: "Confirm booking" }).click();
  await expect(page.getByRole("status")).toContainText("Booking confirmed.");
  await expect(confirmCard).toHaveCount(0);

  const declineCard = page
    .getByRole("listitem")
    .filter({ hasText: declineStudentName });
  await declineCard.getByRole("button", { name: "Decline", exact: true }).click();
  const confirmation = page.getByRole("group", {
    name: `Confirm declining ${declineStudentName}'s request`,
  });
  await expect(confirmation).toContainText("will be refunded");
  await expect(confirmation).toContainText("12,000");
  await confirmation
    .getByRole("button", { name: "Yes, decline and refund" })
    .click();

  await expect(page.getByRole("status")).toContainText(
    "Booking declined. Refund needs reconciliation.",
  );
  expect(bookingActions).toEqual([
    { id: confirmBookingId, action: "confirm" },
    { id: declineBookingId, action: "decline" },
  ]);
});
