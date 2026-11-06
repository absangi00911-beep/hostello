import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { parse as parseDotenv } from "dotenv";
import { encode } from "next-auth/jwt";
import { Pool } from "pg";

const fixtureToken = randomUUID();
const ADMIN_ID = `e2e-payment-admin-${fixtureToken}`;
const ADMIN_EMAIL = `e2e-payment-admin-${fixtureToken}@example.test`;
const STUDENT_ID = `e2e-payment-student-${fixtureToken}`;
const STUDENT_EMAIL = `e2e-payment-student-${fixtureToken}@example.test`;
const OWNER_ID = `e2e-payment-owner-${fixtureToken}`;
const OWNER_EMAIL = `e2e-payment-owner-${fixtureToken}@example.test`;
const HOSTEL_ID = `e2e-payment-hostel-${fixtureToken}`;
const BOOKING_ID = `e2e-payment-booking-${fixtureToken}`;
const HOSTEL_NAME = `E2E Payment Hostel ${fixtureToken}`;
const STUDENT_NAME = `E2E Payment Student ${fixtureToken}`;

const hasDatabasePrerequisites = Boolean(
  process.env.AUTH_SECRET && process.env.DATABASE_URL,
);

// Keep provider and queue settings disabled; the confirmation request is stubbed
// so the browser flow cannot create an immutable audit event or contact Safepay.
const externalServiceEnvNames = [
  "RESEND_API_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "SAFEPAY_SECRET",
  "SAFEPAY_API_KEY",
  "QSTASH_TOKEN",
  "QSTASH_CURRENT_SIGNING_KEY",
  "QSTASH_NEXT_SIGNING_KEY",
];

function hasEffectiveExternalServiceConfiguration() {
  // Apply file settings from lowest to highest precedence. Explicit process
  // environment values (including empty strings) take precedence over all
  // files, matching dotenv/Next.js inheritance without exposing any values.
  const dotenvFiles = [
    ".env",
    ".env.development",
    ".env.local",
    ".env.development.local",
  ];
  const fileEnvironment: Record<string, string> = {};
  for (const file of dotenvFiles) {
    const filePath = resolve(process.cwd(), file);
    if (!existsSync(filePath)) continue;
    Object.assign(fileEnvironment, parseDotenv(readFileSync(filePath)));
  }

  return externalServiceEnvNames.some((name) => {
    const effectiveValue = Object.hasOwn(process.env, name)
      ? process.env[name]
      : fileEnvironment[name];
    return Boolean(effectiveValue?.trim());
  });
}

const hasExternalServiceCredentials =
  hasEffectiveExternalServiceConfiguration();

test.skip(
  !hasDatabasePrerequisites || hasExternalServiceCredentials,
  "Requires AUTH_SECRET and a disposable loopback *_test Postgres, with provider/queue credentials unset.",
);

function assertLoopbackTestDatabase(databaseUrl: string) {
  const parsed = new URL(databaseUrl);
  const databaseName = decodeURIComponent(parsed.pathname.slice(1));
  if (
    !["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsed.hostname) ||
    !databaseName.endsWith("_test")
  ) {
    throw new Error(
      "Admin payment E2E requires a loopback Postgres database with a _test name.",
    );
  }
}

function assertLoopbackBaseUrl(baseURL: string) {
  const { hostname, protocol } = new URL(baseURL);
  if (
    !["http:", "https:"].includes(protocol) ||
    !["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname)
  ) {
    throw new Error(
      "Admin payment E2E requires an HTTP(S) loopback application URL.",
    );
  }
}

let pool: Pool | undefined;

test.beforeAll(async () => {
  const databaseUrl = process.env.DATABASE_URL as string;
  assertLoopbackTestDatabase(databaseUrl);
  pool = new Pool({ connectionString: databaseUrl });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO users (id, email, name, role, "tokenVersion", "updatedAt")
       VALUES
         ($1, $2, 'E2E Payment Admin', 'ADMIN', 0, now()),
         ($3, $4, $5, 'STUDENT', 0, now()),
         ($6, $7, 'E2E Payment Owner', 'OWNER', 0, now())`,
      [
        ADMIN_ID,
        ADMIN_EMAIL,
        STUDENT_ID,
        STUDENT_EMAIL,
        STUDENT_NAME,
        OWNER_ID,
        OWNER_EMAIL,
      ],
    );
    await client.query(
      `INSERT INTO hostels (
         id, name, slug, description, city, address, "pricePerMonth",
         rooms, capacity, amenities, rules, images, "ownerId", "updatedAt"
       )
       VALUES (
         $1, $2, $3, 'Disposable payment operations fixture.',
         'Test City', 'Test Address', 1200, 1, 1,
         ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[], $4, now()
       )`,
      [HOSTEL_ID, HOSTEL_NAME, `e2e-payment-${fixtureToken}`, OWNER_ID],
    );
    await client.query(
      `INSERT INTO bookings (
         id, "hostelId", "userId", "checkIn", "checkOut", months, guests,
         total, "cancellationRefundAmount", "refundedAmount", "paymentStatus",
         "paymentMethod", "transactionId", "refundState", status, "createdAt",
         "updatedAt"
       )
       VALUES (
         $1, $2, $3, DATE '2027-01-01', DATE '2027-02-01', 1, 1,
         1200, 1200, 0, 'PAID', 'safepay', $4, 'UNCERTAIN', 'CANCELLED',
         now() + interval '1 hour', now()
       )`,
      [BOOKING_ID, HOSTEL_ID, STUDENT_ID, `e2e-txn-${fixtureToken}`],
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
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`DELETE FROM bookings WHERE id = $1`, [BOOKING_ID]);
      await client.query(`DELETE FROM hostels WHERE id = $1`, [HOSTEL_ID]);
      await client.query(
        `DELETE FROM users WHERE id = ANY($1::text[])`,
        [[ADMIN_ID, STUDENT_ID, OWNER_ID]],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
});

test("admin requests manual confirmation for an uncertain refund", async ({
  page,
  context,
  baseURL,
}) => {
  assertLoopbackBaseUrl(baseURL as string);
  const secure = new URL(baseURL as string).protocol === "https:";
  const cookieName = secure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
  const sessionToken = await encode({
    token: {
      sub: ADMIN_ID,
      id: ADMIN_ID,
      role: "ADMIN",
      tokenVersion: 0,
      emailVerified: null,
      email: ADMIN_EMAIL,
      name: "E2E Payment Admin",
    },
    secret: process.env.AUTH_SECRET as string,
    salt: cookieName,
  });
  await context.addCookies([
    { name: cookieName, value: sessionToken, url: baseURL as string },
  ]);

  const manualActions: unknown[] = [];
  await page.route(
    (url) => url.pathname.startsWith("/api/admin/bookings/"),
    async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (
        request.method() !== "PATCH" ||
        url.pathname !== `/api/admin/bookings/${BOOKING_ID}/refund`
      ) {
        await route.abort();
        return;
      }

      const body = request.postDataJSON();
      manualActions.push(body);
      if (
        typeof body !== "object" ||
        body === null ||
        Array.isArray(body) ||
        body.manualConfirmation !== true
      ) {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ error: "Expected manual refund confirmation." }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id: BOOKING_ID,
            paymentStatus: "REFUNDED",
            refundState: "REFUNDED",
            refundedAmount: 1200,
          },
          automatic: false,
          manualConfirmed: true,
        }),
      });
    },
  );

  await page.goto("/admin/refunds");

  const bookingCard = page
    .locator("li")
    .filter({ hasText: STUDENT_NAME });
  await expect(bookingCard).toHaveCount(1);
  await expect(bookingCard.getByText("Outcome unconfirmed")).toBeVisible();
  await bookingCard
    .getByRole("button", { name: "Confirm refund manually" })
    .first()
    .click();

  const confirmation = bookingCard.getByRole("button", {
    name: "Confirm refund manually",
  }).last();
  await expect(confirmation).toBeDisabled();
  await bookingCard
    .getByLabel("I verified this refund in Safepay.")
    .check();
  await expect(confirmation).toBeEnabled();
  await confirmation.click();

  await expect(
    page.getByRole("status").filter({
      hasText: `Refund for ${STUDENT_NAME} recorded as confirmed.`,
    }),
  ).toBeVisible();
  expect(manualActions).toEqual([{ manualConfirmation: true }]);
});
