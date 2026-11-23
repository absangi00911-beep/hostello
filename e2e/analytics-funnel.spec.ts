import nextEnv from "@next/env";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { encode } from "next-auth/jwt";
import { Pool } from "pg";

const { loadEnvConfig } = nextEnv;

// The funnel events, end to end: a real browser sends them through POST /api/events into a
// real database, and the booking request records its own event on the server. Runs against
// the regular dev server (npm run e2e); payment events need the Safepay fake and are covered
// in e2e/payments.

const databaseUrl = process.env.DATABASE_URL;
const authSecret = process.env.AUTH_SECRET;
const hasPrerequisites = Boolean(databaseUrl && authSecret);

function assertDisposableDatabase(url: string) {
  const parsed = new URL(url);
  const name = decodeURIComponent(parsed.pathname.slice(1));
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsed.hostname) || !name.endsWith("_test")) {
    throw new Error("Analytics E2E requires a loopback Postgres database with a _test name.");
  }
}

function assertLoopbackBaseUrl(baseURL: string) {
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(new URL(baseURL).hostname)) {
    throw new Error("Analytics E2E requires a loopback application URL.");
  }
}

// Booking requests are rate limited through Redis: only run against a local or absent one.
function hasRemoteRedisConfiguration() {
  const originalEnv = { ...process.env };
  try {
    const { combinedEnv } = loadEnvConfig(process.cwd(), true, { info() {}, error: (...args: unknown[]) => console.error(...args) });
    const redisUrl = combinedEnv.UPSTASH_REDIS_REST_URL;
    if (!redisUrl || !combinedEnv.UPSTASH_REDIS_REST_TOKEN) return false;
    try {
      return !["localhost", "127.0.0.1", "::1", "[::1]"].includes(new URL(redisUrl).hostname);
    } catch {
      return true;
    }
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
    Object.assign(process.env, originalEnv);
  }
}

test.skip(hasRemoteRedisConfiguration(), "Skipped: the effective Redis configuration is not loopback.");
test.skip(!hasPrerequisites, "Set AUTH_SECRET and a disposable loopback DATABASE_URL ending in _test.");

const token = randomUUID().replaceAll("-", "").slice(0, 12);
// The booking API validates hostel and room IDs as cuids: a "c", then letters and digits.
const ids = {
  owner: `canalyticsowner${token}`,
  student: `canalyticsstudent${token}`,
  hostel: `canalyticshostel${token}`,
  room: `canalyticsroom${token}`,
};
const studentEmail = `e2e-analytics-${token}@example.test`;
const slug = `e2e-analytics-hostel-${token}`;
const hostelName = `E2E Analytics Hostel ${token}`;
const city = `Analyticsville${token}`;

let pool: Pool;

test.beforeAll(async () => {
  assertDisposableDatabase(databaseUrl as string);
  pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const [id, role, email] of [
      [ids.owner, "OWNER", `${ids.owner}@example.test`],
      [ids.student, "STUDENT", studentEmail],
    ]) {
      await client.query(`INSERT INTO users (id, email, name, role, "tokenVersion", "updatedAt") VALUES ($1, $2, $3, $4, 0, now())`, [id, email, `E2E Analytics ${role}`, role]);
    }
    await client.query(
      `INSERT INTO hostels (id, name, slug, description, status, city, area, address, latitude, longitude,
         "pricePerMonth", rooms, capacity, rating, "reviewCount", gender, amenities, rules, images, "coverImage",
         verified, featured, "cancellationPolicy", "ownerId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 'A hostel used only by the analytics end-to-end test.', 'ACTIVE', $4, 'Centre', 'Centre, ' || $4,
         30.18, 67.01, 6000, 1, 2, 0, 0, 'MALE', ARRAY['wifi'], ARRAY['Quiet after 10pm'], ARRAY[]::text[], NULL,
         false, false, 'STANDARD', $5, now(), now())`,
      [ids.hostel, hostelName, slug, city, ids.owner],
    );
    await client.query(
      `INSERT INTO rooms (id, "hostelId", name, description, "pricePerMonth", capacity, available, images, facilities, "createdAt", "updatedAt")
       VALUES ($1, $2, 'Standard Room', 'Shared room.', 6000, 2, 2, ARRAY[]::text[], ARRAY['Wardrobe'], now(), now())`,
      [ids.room, ids.hostel],
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
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM analytics_events WHERE "hostelId" = $1 OR properties->>'city' = $2 OR "bookingId" IN (SELECT id FROM bookings WHERE "hostelId" = $1)`, [ids.hostel, city]);
    await client.query(`DELETE FROM bookings WHERE "hostelId" = $1`, [ids.hostel]);
    await client.query(`DELETE FROM hostels WHERE id = $1`, [ids.hostel]);
    await client.query(`DELETE FROM users WHERE id = ANY($1::text[])`, [[ids.owner, ids.student]]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
});

async function signInAsStudent(context: BrowserContext, baseURL: string) {
  assertLoopbackBaseUrl(baseURL);
  const secure = new URL(baseURL).protocol === "https:";
  const cookieName = secure ? "__Secure-authjs.session-token" : "authjs.session-token";
  const value = await encode({
    token: { sub: ids.student, id: ids.student, role: "STUDENT", tokenVersion: 0, emailVerified: null, email: studentEmail, name: "E2E Analytics STUDENT" },
    secret: authSecret as string,
    salt: cookieName,
  });
  await context.addCookies([{ name: cookieName, value, url: baseURL }]);
}

interface EventRow {
  name: string;
  sessionId: string | null;
  hostelId: string | null;
  bookingId: string | null;
  properties: Record<string, unknown> | null;
}

/** Events for this test's hostel and city, oldest first. Waits for them: browsers send in the background. */
async function eventsFor(expectedNames: readonly string[]): Promise<EventRow[]> {
  let rows: EventRow[] = [];
  await expect
    .poll(
      async () => {
        const result = await pool.query<EventRow>(
          `SELECT name, "sessionId", "hostelId", "bookingId", properties FROM analytics_events
            WHERE "hostelId" = $1 OR properties->>'city' = $2 OR "bookingId" IN (SELECT id FROM bookings WHERE "hostelId" = $1)
            ORDER BY "createdAt" ASC, id ASC`,
          [ids.hostel, city],
        );
        rows = result.rows;
        return expectedNames.every((name) => rows.some((row) => row.name === name));
      },
      { message: `waiting for events ${expectedNames.join(", ")}`, timeout: 30_000 },
    )
    .toBe(true);
  return rows;
}

function wholeMonthStay() {
  const now = new Date();
  const first = (offset: number) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1)).toISOString().slice(0, 10);
  return { moveIn: first(2), moveOut: first(3) };
}

async function requestBookingThroughTheForm(page: Page) {
  const stay = wholeMonthStay();
  await page.getByRole("combobox", { name: "Room" }).selectOption(ids.room);
  await page.getByLabel("Move in", { exact: true }).fill(stay.moveIn);
  await page.getByLabel("Move out", { exact: true }).fill(stay.moveOut);
  await page.getByRole("button", { name: "Review booking" }).click();
  await page.getByRole("button", { name: "Request booking" }).click();
  await expect(page.getByRole("button", { name: "Continue to Safepay" })).toBeVisible();
}

test("a search, a hostel view, a booking start and a booking request are each recorded once, anonymously", async ({ page, context, baseURL }) => {
  await signInAsStudent(context, baseURL as string);

  // Search: the results page for this city.
  await page.goto(`/search?city=${encodeURIComponent(city)}`);
  await expect(page.getByText(hostelName).first()).toBeVisible();
  // View the hostel and go as far as the booking request.
  await page.goto(`/hostels/${slug}`);
  await requestBookingThroughTheForm(page);

  const events = await eventsFor(["search_performed", "hostel_viewed", "booking_started", "booking_requested"]);
  const byName = (name: string) => events.filter((event) => event.name === name);

  expect(byName("search_performed")).toHaveLength(1);
  expect(byName("search_performed")[0].properties).toEqual({ city, nearby: false, hasDates: false, resultCount: 1 });
  expect(byName("hostel_viewed")).toHaveLength(1);
  expect(byName("hostel_viewed")[0]).toMatchObject({ hostelId: ids.hostel, bookingId: null, properties: null });
  expect(byName("booking_started")).toHaveLength(1);
  expect(byName("booking_started")[0]).toMatchObject({ hostelId: ids.hostel, properties: { roomId: ids.room } });

  // The booking request is recorded by the server, tied to the booking it created.
  const booking = await pool.query<{ id: string }>(`SELECT id FROM bookings WHERE "hostelId" = $1`, [ids.hostel]);
  expect(booking.rows).toHaveLength(1);
  expect(byName("booking_requested")).toHaveLength(1);
  expect(byName("booking_requested")[0]).toMatchObject({ hostelId: ids.hostel, bookingId: booking.rows[0].id, sessionId: null });

  // One tab session ties the three browser events together; the money step carries none.
  const sessions = new Set(["search_performed", "hostel_viewed", "booking_started"].map((name) => byName(name)[0].sessionId));
  expect(sessions.size).toBe(1);
  expect([...sessions][0]).toMatch(/^[0-9a-f-]{36}$/);

  // Nothing that identifies the student was stored, anywhere in the rows.
  const everything = JSON.stringify(events);
  expect(everything).not.toContain(ids.student);
  expect(everything).not.toContain(studentEmail);
});

test("a visitor who sends Global Privacy Control is not tracked at all", async ({ page, context, baseURL }) => {
  await signInAsStudent(context, baseURL as string);
  await page.addInitScript(() => Object.defineProperty(navigator, "globalPrivacyControl", { value: true }));
  const eventRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/events")) eventRequests.push(request.url());
  });

  const before = await pool.query(`SELECT count(*)::int AS n FROM analytics_events WHERE "hostelId" = $1`, [ids.hostel]);
  await page.goto(`/hostels/${slug}`);
  await expect(page.getByRole("heading", { name: hostelName }).first()).toBeVisible();
  await page.getByRole("combobox", { name: "Room" }).selectOption(ids.room);
  await page.waitForTimeout(2000);

  expect(eventRequests).toEqual([]);
  const after = await pool.query(`SELECT count(*)::int AS n FROM analytics_events WHERE "hostelId" = $1`, [ids.hostel]);
  expect(after.rows[0].n).toBe(before.rows[0].n);
});

test("the endpoint refuses to record events the browser is not allowed to send", async ({ request, baseURL }) => {
  const origin = { origin: new URL(baseURL as string).origin, "content-type": "application/json" };
  const session = randomUUID();

  // The money steps are server-only: a browser cannot inflate them.
  const forged = await request.post("/api/events", { headers: origin, data: JSON.stringify({ name: "payment_confirmed", sessionId: session, properties: { hostelId: ids.hostel } }) });
  expect(forged.status()).toBe(400);
  // Extra properties are refused, so a client cannot smuggle data into the table.
  const extra = await request.post("/api/events", { headers: origin, data: JSON.stringify({ name: "hostel_viewed", sessionId: session, properties: { hostelId: ids.hostel, email: studentEmail } }) });
  expect(extra.status()).toBe(400);

  const stored = await pool.query(`SELECT count(*)::int AS n FROM analytics_events WHERE "sessionId" = $1`, [session]);
  expect(stored.rows[0].n).toBe(0);
});
