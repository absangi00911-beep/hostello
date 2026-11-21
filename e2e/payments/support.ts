import { createHmac, randomUUID } from "node:crypto";
import type { APIRequestContext, BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { Pool } from "pg";
import { E2E_CRON_SECRET, FAKE_SAFEPAY } from "./constants";

/** Refuse to run unless the database is a throwaway loopback *_test one. */
export function assertDisposableDatabase(databaseUrl: string): void {
  const parsed = new URL(databaseUrl);
  const databaseName = decodeURIComponent(parsed.pathname.slice(1));
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsed.hostname) || !databaseName.endsWith("_test")) {
    throw new Error("Payment E2E requires a loopback Postgres database with a _test name.");
  }
}

export function assertLoopbackBaseUrl(baseURL: string): void {
  const { hostname, protocol } = new URL(baseURL);
  if (!["http:", "https:"].includes(protocol) || !["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname)) {
    throw new Error("Payment E2E requires an HTTP(S) loopback application URL.");
  }
}

export interface PaymentFixtures {
  token: string;
  ownerId: string;
  studentId: string;
  studentEmail: string;
  studentName: string;
  hostelId: string;
  hostelSlug: string;
  hostelName: string;
  roomId: string;
  roomName: string;
  roomPricePerMonth: number;
}

export function newFixtureIds(): PaymentFixtures {
  const token = randomUUID().replaceAll("-", "").slice(0, 12);
  return {
    token,
    // The booking API validates hostel and room IDs as cuids: a "c", then letters and digits.
    ownerId: `cpayowner${token}`,
    studentId: `cpaystudent${token}`,
    studentEmail: `e2e-pay-student-${token}@example.test`,
    studentName: `E2E Pay Student ${token}`,
    hostelId: `cpayhostel${token}`,
    hostelSlug: `e2e-pay-hostel-${token}`,
    hostelName: `E2E Pay Hostel ${token}`,
    roomId: `cpayroom${token}`,
    roomName: "Standard Room",
    roomPricePerMonth: 6000,
  };
}

/** One owner, one student, one active hostel with one room that has two free beds. */
export async function seedPaymentFixtures(pool: Pool, fixtures: PaymentFixtures): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO users (id, email, name, role, "tokenVersion", "updatedAt")
       VALUES ($1, $2, 'E2E Pay Owner', 'OWNER', 0, now())`,
      [fixtures.ownerId, `${fixtures.ownerId}@example.test`],
    );
    await client.query(
      `INSERT INTO users (id, email, name, role, "tokenVersion", "updatedAt")
       VALUES ($1, $2, $3, 'STUDENT', 0, now())`,
      [fixtures.studentId, fixtures.studentEmail, fixtures.studentName],
    );
    await client.query(
      `INSERT INTO hostels (
         id, name, slug, description, status, city, area, address, latitude, longitude,
         "pricePerMonth", rooms, capacity, rating, "reviewCount", gender, amenities, rules,
         images, "coverImage", verified, featured, "cancellationPolicy", "ownerId",
         "createdAt", "updatedAt"
       ) VALUES (
         $1, $2, $3, 'A hostel used only by the payment end-to-end test.', 'ACTIVE',
         'Quetta', 'Sariab Road', 'Sariab Road, Quetta', 30.1798, 67.0099,
         $4, 1, 2, 0, 0, 'MALE', ARRAY['wifi'], ARRAY['Quiet after 10pm'],
         ARRAY[]::text[], NULL, false, false, 'STANDARD', $5, now(), now()
       )`,
      [fixtures.hostelId, fixtures.hostelName, fixtures.hostelSlug, fixtures.roomPricePerMonth, fixtures.ownerId],
    );
    await client.query(
      `INSERT INTO rooms (id, "hostelId", name, description, "pricePerMonth", capacity, available,
                          images, facilities, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 'Shared room with two beds.', $4, 2, 2, ARRAY[]::text[], ARRAY['Wardrobe'], now(), now())`,
      [fixtures.roomId, fixtures.hostelId, fixtures.roomName, fixtures.roomPricePerMonth],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * True when Postgres refused a delete because of a late-payment resolution: either the foreign
 * key that points at the booking (checked first, so it is what actually fires) or the
 * append-only trigger on the table itself.
 */
function isAppendOnlyFinancialRecord(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const constraint = (error as { constraint?: string }).constraint ?? "";
  return constraint.startsWith("late_payment_resolutions_") || error.message.includes("is append-only");
}

/**
 * Removes everything the fixtures created. Notifications, outbox rows, seat holds and rooms
 * go with their parents (ON DELETE CASCADE).
 *
 * Late-payment resolutions are an append-only financial record that the database refuses to
 * delete, and they reference the booking. When a test produced one, the rows cannot go; the
 * hostel is suspended instead so it never shows up in listings or other specs. Nothing else
 * is swallowed.
 */
export async function retirePaymentFixtures(pool: Pool, fixtures: PaymentFixtures): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM bookings WHERE "hostelId" = $1`, [fixtures.hostelId]);
    await client.query(`DELETE FROM hostels WHERE id = $1`, [fixtures.hostelId]);
    await client.query(`DELETE FROM users WHERE id = ANY($1::text[])`, [[fixtures.studentId, fixtures.ownerId]]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    if (!isAppendOnlyFinancialRecord(error)) throw error;
    await pool.query(`UPDATE hostels SET status = 'SUSPENDED' WHERE id = $1`, [fixtures.hostelId]);
  } finally {
    client.release();
  }
}

/** Hostels earlier runs had to leave behind (see retirePaymentFixtures) must stay out of listings. */
export async function suspendLeftoverPaymentHostels(pool: Pool): Promise<void> {
  await pool.query(`UPDATE hostels SET status = 'SUSPENDED' WHERE slug LIKE 'e2e-pay-hostel-%' AND status = 'ACTIVE'`);
}

/** Signs the student in by minting the session cookie the app would have issued. */
export async function signInAsStudent(context: BrowserContext, baseURL: string, fixtures: PaymentFixtures): Promise<void> {
  assertLoopbackBaseUrl(baseURL);
  const secure = new URL(baseURL).protocol === "https:";
  const cookieName = secure ? "__Secure-authjs.session-token" : "authjs.session-token";
  const sessionToken = await encode({
    token: {
      sub: fixtures.studentId,
      id: fixtures.studentId,
      role: "STUDENT",
      tokenVersion: 0,
      emailVerified: null,
      email: fixtures.studentEmail,
      name: fixtures.studentName,
    },
    secret: process.env.AUTH_SECRET as string,
    salt: cookieName,
  });
  await context.addCookies([{ name: cookieName, value: sessionToken, url: baseURL }]);
}

export interface SafepayEventInput {
  type: "payment.succeeded" | "payment.failed";
  tracker: string;
  bookingId: string;
  /** Whole PKR, as stored on the booking. Converted to paisa like Safepay sends it. */
  amountPkr: number;
  state?: string;
  currency?: string;
  merchantApiKey?: string;
}

/** The raw body and headers of a webhook as Safepay would sign and send it. */
export function buildSafepayWebhook(input: SafepayEventInput, options: { signWith?: string } = {}) {
  const body = JSON.stringify({
    type: input.type,
    merchant_api_key: input.merchantApiKey ?? FAKE_SAFEPAY.apiKey,
    data: {
      tracker: input.tracker,
      state: input.state ?? "TRACKER_ENDED",
      amount: input.amountPkr * 100,
      currency: input.currency ?? "PKR",
      metadata: { order_id: input.bookingId },
    },
  });
  const signature = createHmac("sha512", options.signWith ?? FAKE_SAFEPAY.webhookSecret).update(body).digest("hex");
  return { body, headers: { "content-type": "application/json", "x-sfpy-signature": signature } };
}

export async function postSafepayWebhook(
  request: APIRequestContext,
  input: SafepayEventInput,
  options: { signWith?: string } = {},
) {
  const { body, headers } = buildSafepayWebhook(input, options);
  return request.post("/api/payment/webhook", { data: body, headers });
}

export async function runCleanupJob(request: APIRequestContext, job: string) {
  return request.post(`/api/cron/${job}`, { headers: { authorization: `Bearer ${E2E_CRON_SECRET}` } });
}

export interface BookingRow {
  id: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  transactionId: string | null;
  total: number;
}

export async function findBookings(pool: Pool, hostelId: string): Promise<BookingRow[]> {
  const result = await pool.query<BookingRow>(
    `SELECT id, status, "paymentStatus", "paymentMethod", "transactionId", total
       FROM bookings WHERE "hostelId" = $1 ORDER BY "createdAt" ASC`,
    [hostelId],
  );
  return result.rows;
}

/**
 * A stay the booking form accepts: it starts on the first day of a month some months ahead
 * and ends on the first day of a month later, because move-out must be a whole number of
 * months after move-in.
 */
export function wholeMonthStay(startsInMonths = 2, months = 1): { moveIn: string; moveOut: string; months: number } {
  const now = new Date();
  const first = (offset: number) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1)).toISOString().slice(0, 10);
  return { moveIn: first(startsInMonths), moveOut: first(startsInMonths + months), months };
}

const JSON_HEADERS = (baseURL: string) => ({ origin: baseURL, "content-type": "application/json" });

/** Creates a booking the way the booking card does, without driving the form. */
export async function createBooking(
  context: BrowserContext,
  baseURL: string,
  fixtures: PaymentFixtures,
  stay = wholeMonthStay(),
): Promise<{ id: string; total: number }> {
  const response = await context.request.post("/api/bookings", {
    headers: JSON_HEADERS(baseURL),
    data: JSON.stringify({
      hostelId: fixtures.hostelId,
      roomId: fixtures.roomId,
      checkIn: stay.moveIn,
      checkOut: stay.moveOut,
      guests: 1,
      paymentMethod: "safepay",
    }),
  });
  if (response.status() !== 201) throw new Error(`Creating the booking failed: ${response.status()} ${await response.text()}`);
  const payload = (await response.json()) as { data: { id: string; total: number } };
  return { id: payload.data.id, total: payload.data.total };
}

/** Starts a Safepay checkout for the booking, as the Pay now / Continue to Safepay buttons do. */
export async function initiatePayment(
  context: BrowserContext,
  baseURL: string,
  bookingId: string,
): Promise<{ status: number; paymentUrl: string | null; error: string | null }> {
  const response = await context.request.post("/api/payment/initiate", {
    headers: JSON_HEADERS(baseURL),
    data: JSON.stringify({ bookingId }),
  });
  const payload = (await response.json().catch(() => null)) as { data?: { paymentUrl?: string }; error?: string } | null;
  return { status: response.status(), paymentUrl: payload?.data?.paymentUrl ?? null, error: payload?.error ?? null };
}

export async function countNotifications(pool: Pool, userIds: readonly string[]): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT count(*) FROM notifications WHERE "userId" = ANY($1::text[])`,
    [userIds],
  );
  return Number(result.rows[0].count);
}

export async function countSeatHolds(pool: Pool, bookingId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(`SELECT count(*) FROM seat_holds WHERE "bookingId" = $1`, [bookingId]);
  return Number(result.rows[0].count);
}

export async function findLatePaymentResolutions(pool: Pool, bookingId: string) {
  const result = await pool.query<{ providerTracker: string; reason: string; outcome: string; amount: number; currency: string }>(
    `SELECT "providerTracker", reason, outcome, amount, currency
       FROM late_payment_resolutions WHERE "bookingId" = $1 ORDER BY "recordedAt" ASC`,
    [bookingId],
  );
  return result.rows;
}

/** Makes a booking look as if it was created this many minutes ago. */
export async function ageBooking(pool: Pool, bookingId: string, minutes: number): Promise<void> {
  await pool.query(`UPDATE bookings SET "createdAt" = now() - ($2 || ' minutes')::interval WHERE id = $1`, [bookingId, String(minutes)]);
}
