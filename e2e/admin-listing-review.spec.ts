import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { parse as parseDotenv } from "dotenv";
import { encode } from "next-auth/jwt";
import { Pool } from "pg";

const suffix = randomBytes(12).toString("hex");
// CUID-shaped identifiers satisfy the moderation API's CUID validation while
// remaining unique across serial or overlapping local test runs.
const adminId = `c${suffix}`;
const ownerId = `c${randomBytes(12).toString("hex")}`;
const hostelId = `c${randomBytes(12).toString("hex")}`;
const adminEmail = `e2e-admin-listing-review-${suffix}@example.test`;
const ownerEmail = `e2e-listing-review-owner-${suffix}@example.test`;
const hostelName = `E2E Review Listing ${suffix}`;
const hostelSlug = `e2e-review-listing-${suffix}`;
const hasPrerequisites = Boolean(
  process.env.AUTH_SECRET && process.env.DATABASE_URL,
);

function isLoopback(hostname: string) {
  return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname);
}

function assertDisposableDatabase(databaseUrl: string) {
  const parsed = new URL(databaseUrl);
  const databaseName = decodeURIComponent(parsed.pathname.slice(1));
  if (!isLoopback(parsed.hostname) || !databaseName.endsWith("_test")) {
    throw new Error(
      "Admin listing-review E2E requires a loopback Postgres database with a _test name.",
    );
  }
}

function hasRemoteProviderConfiguration() {
  const dotenvFiles = [
    ".env.e2e",
    ".env.development.local",
    ".env.local",
    ".env.development",
    ".env",
  ];
  const dotenvValues = new Map<string, string[]>();
  for (const file of dotenvFiles) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    const parsed = parseDotenv(readFileSync(path));
    for (const [name, value] of Object.entries(parsed)) {
      const values = dotenvValues.get(name) ?? [];
      values.push(value);
      dotenvValues.set(name, values);
    }
  }

  // Process values take precedence over dotenv files, including an explicit
  // empty value used to disable a provider for this test process.
  const configuredValues = (name: string) =>
    process.env[name] !== undefined
      ? [process.env[name]!.trim()]
      : (dotenvValues.get(name) ?? []).map((value) => value.trim());

  const resendWouldSend = configuredValues("RESEND_API_KEY").some(
    (key) => Boolean(key) && key !== "re_placeholder" && key.startsWith("re_"),
  );
  const hasUpstashConfiguration = [
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
  ].some((name) => configuredValues(name).some(Boolean));
  const hasRemoteTypesense = configuredValues("TYPESENSE_HOST").some(
    (host) => Boolean(host) && !isLoopback(host),
  );

  return Boolean(
    hasUpstashConfiguration || resendWouldSend || hasRemoteTypesense,
  );
}

test.skip(
  !hasPrerequisites,
  "Set AUTH_SECRET and a disposable loopback DATABASE_URL ending in _test to run admin listing-review.",
);
test.skip(
  hasRemoteProviderConfiguration(),
  "Admin listing-review requires local-only integrations (no configured Upstash/Resend or remote Typesense).",
);

let pool: Pool | undefined;

test.beforeAll(async () => {
  const databaseUrl = process.env.DATABASE_URL as string;
  // This guard is intentionally before pool creation and every database write.
  assertDisposableDatabase(databaseUrl);
  pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO users (id, email, name, role, "tokenVersion", "updatedAt")
       VALUES
         ($1, $2, 'E2E Listing Review Admin', 'ADMIN', 0, now()),
         ($3, $4, 'E2E Listing Review Owner', 'OWNER', 0, now())`,
      [adminId, adminEmail, ownerId, ownerEmail],
    );
    await client.query(
      `INSERT INTO hostels (
         id, name, slug, description, status, city, area, address,
         "pricePerMonth", rooms, capacity, gender, amenities, rules, images,
         verified, featured, "ownerId", "createdAt", "updatedAt"
       ) VALUES (
         $1, $2, $3, 'A test listing awaiting admin review.',
         'PENDING_REVIEW', 'Lahore', 'Gulberg', 'E2E review address',
         12000, 4, 8, 'MIXED', ARRAY['wifi'], ARRAY['quiet hours'],
         ARRAY[]::text[], false, false, $4, now(), now()
       )`,
      [hostelId, hostelName, hostelSlug, ownerId],
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
    await client.query(
      `DELETE FROM notifications
       WHERE "hostelId" = $1 OR "userId" = ANY($2::text[])`,
      [hostelId, [adminId, ownerId]],
    );
    await client.query(
      `DELETE FROM hostel_verification_reviews WHERE "hostelId" = $1`,
      [hostelId],
    );
    await client.query(`DELETE FROM hostels WHERE id = $1`, [hostelId]);
    await client.query(`DELETE FROM users WHERE id = $1`, [adminId]);
    await client.query(`DELETE FROM users WHERE id = $1`, [ownerId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
});

test("admin verifies a pending listing and persists the review", async ({
  context,
  page,
  baseURL,
}) => {
  const appUrl = new URL(baseURL as string);
  if (
    !["http:", "https:"].includes(appUrl.protocol) ||
    !isLoopback(appUrl.hostname)
  ) {
    throw new Error(
      "Admin listing-review E2E will only open a loopback application URL.",
    );
  }

  const secure = appUrl.protocol === "https:";
  const cookieName = secure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
  const sessionToken = await encode({
    token: {
      sub: adminId,
      id: adminId,
      role: "ADMIN",
      tokenVersion: 0,
      emailVerified: null,
      email: adminEmail,
      name: "E2E Listing Review Admin",
    },
    secret: process.env.AUTH_SECRET as string,
    salt: cookieName,
  });
  await context.addCookies([
    { name: cookieName, value: sessionToken, url: baseURL as string },
  ]);

  await page.goto("/admin/listings");
  await expect(
    page.getByRole("heading", { name: "Listing review", exact: true }),
  ).toBeVisible();

  const listingCard = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name: hostelName, exact: true }) });
  await expect(listingCard).toBeVisible();
  await listingCard.getByRole("button", { name: "Verify and publish" }).click();

  await listingCard
    .getByRole("checkbox", {
      name: "The owner is allowed to list this property",
    })
    .check();
  await listingCard
    .getByRole("checkbox", { name: "The address and location are correct" })
    .check();
  await listingCard
    .getByRole("checkbox", {
      name: "The description, rooms and prices are accurate",
    })
    .check();
  await listingCard
    .getByRole("checkbox", { name: "The photos show this property" })
    .check();

  const moderationResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/admin/hostels") &&
      response.request().method() === "PATCH",
  );
  await listingCard
    .locator("form")
    .getByRole("button", { name: "Verify and publish" })
    .click();
  expect((await moderationResponse).status()).toBe(200);
  await expect(
    page.getByText(`${hostelName} is verified and live. The owner has been notified.`),
  ).toBeVisible();
  await expect(listingCard).toHaveCount(0);

  const persisted = await pool!.query<{
    status: string;
    verified: boolean;
    reviewCount: string;
  }>(
    `SELECT h.status, h.verified,
            (SELECT count(*) FROM hostel_verification_reviews r
             WHERE r."hostelId" = h.id
               AND r."reviewedById" = $2
               AND r."ownerAuthorityChecked" = true
               AND r."locationChecked" = true
               AND r."listingDetailsChecked" = true
               AND r."photosChecked" = true) AS "reviewCount"
     FROM hostels h
     WHERE h.id = $1`,
    [hostelId, adminId],
  );
  expect(persisted.rows).toEqual([
    { status: "ACTIVE", verified: true, reviewCount: "1" },
  ]);
});
