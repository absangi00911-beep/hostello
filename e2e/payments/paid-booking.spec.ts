import { expect, test, type Page } from "@playwright/test";
import { Pool } from "pg";
import { APP_URL, FAKE_SAFEPAY_PORT } from "./constants";
import { FakeSafepay } from "./fake-safepay";
import {
  ageBooking,
  assertDisposableDatabase,
  assertLoopbackBaseUrl,
  buildSafepayWebhook,
  countNotifications,
  countSeatHolds,
  createBooking,
  findBookings,
  findLatePaymentResolutions,
  initiatePayment,
  newFixtureIds,
  postSafepayWebhook,
  retirePaymentFixtures,
  runCleanupJob,
  seedPaymentFixtures,
  signInAsStudent,
  suspendLeftoverPaymentHostels,
  wholeMonthStay,
  type PaymentFixtures,
} from "./support";

// The paid-booking journey, from the booking form to a confirmed payment, with the failures
// that matter around it. It runs the real app against a real database. Only Safepay is
// replaced: the dev server sends every Safepay request to FakeSafepay (see
// playwright.payments.config.ts), and the test plays Safepay's part by posting signed webhooks.
//
//   npm run e2e:payments     (needs DATABASE_URL: a loopback Postgres database ending in _test)

const databaseUrl = process.env.DATABASE_URL;
test.skip(!databaseUrl, "Set DATABASE_URL to a disposable loopback Postgres database ending in _test.");

const fake = new FakeSafepay();
let pool: Pool;
let fixtures: PaymentFixtures;

test.beforeAll(async () => {
  assertDisposableDatabase(databaseUrl as string);
  assertLoopbackBaseUrl(APP_URL);
  pool = new Pool({ connectionString: databaseUrl });
  await suspendLeftoverPaymentHostels(pool);
  await fake.start(FAKE_SAFEPAY_PORT);
});

test.afterAll(async () => {
  await fake.stop();
  await pool?.end();
});

test.beforeEach(async ({ context }) => {
  fixtures = newFixtureIds();
  fake.reset();
  await seedPaymentFixtures(pool, fixtures);
  await signInAsStudent(context, APP_URL, fixtures);
});

test.afterEach(async () => {
  await retirePaymentFixtures(pool, fixtures);
});

/** The browser would leave for Safepay's hosted checkout; show a stand-in page instead. */
async function stubSafepayCheckoutPage(page: Page) {
  await page.route(/^https:\/\/([a-z0-9-]+\.)*getsafepay\.com\//, (route) =>
    route.fulfill({ contentType: "text/html", body: "<title>Fake Safepay checkout</title><h1>Fake Safepay checkout</h1>" }),
  );
}

const onlyBooking = async () => {
  const bookings = await findBookings(pool, fixtures.hostelId);
  expect(bookings).toHaveLength(1);
  return bookings[0];
};

test("a student books a room, is sent to Safepay, and sees the payment once Safepay confirms it", async ({ page, request }) => {
  await stubSafepayCheckoutPage(page);
  const stay = wholeMonthStay();

  // The booking form.
  await page.goto(`/hostels/${fixtures.hostelSlug}`);
  await page.getByRole("combobox", { name: "Room" }).selectOption(fixtures.roomId);
  await page.getByLabel("Move in", { exact: true }).fill(stay.moveIn);
  await page.getByLabel("Move out", { exact: true }).fill(stay.moveOut);
  await page.getByRole("button", { name: "Review booking" }).click();
  await expect(page.getByText("Review your booking").first()).toBeVisible();
  await page.getByRole("button", { name: "Request booking" }).click();
  await expect(page.getByRole("button", { name: "Continue to Safepay" })).toBeVisible();

  // The booking exists, unpaid, and holds a bed.
  const booking = await onlyBooking();
  expect(booking).toMatchObject({ status: "PENDING", paymentStatus: "PENDING", paymentMethod: "safepay", total: 6000, transactionId: null });
  expect(await countSeatHolds(pool, booking.id)).toBe(1);

  // Checkout: the app asks Safepay for a session for exactly this booking and amount.
  await page.getByRole("button", { name: "Continue to Safepay" }).click();
  await page.waitForURL(/getsafepay\.com\/embedded\//);
  const checkout = new URL(page.url());
  const tracker = fake.trackers[0];

  expect(fake.sessionRequests).toHaveLength(1);
  expect(fake.sessionRequests[0].body).toMatchObject({ currency: "PKR", amount: 600_000, metadata: { order_id: booking.id } });
  expect(checkout.searchParams.get("tracker")).toBe(tracker);
  expect(checkout.searchParams.get("order_id")).toBe(booking.id);
  expect(checkout.searchParams.get("redirect_url")).toBe(`${APP_URL}/booking/${booking.id}/payment?payment=return`);

  // Safepay confirms the payment.
  const confirmation = await postSafepayWebhook(request, {
    type: "payment.succeeded",
    tracker,
    bookingId: booking.id,
    amountPkr: booking.total,
  });
  expect(confirmation.status()).toBe(200);
  expect(await confirmation.json()).toMatchObject({ received: true });

  // Paid, with the tracker recorded. The booking stays pending: the owner still has to accept.
  expect(await onlyBooking()).toMatchObject({ status: "PENDING", paymentStatus: "PAID", transactionId: tracker });

  // Safepay sends the student back to the app, which shows what happened.
  await page.goto(checkout.searchParams.get("redirect_url") as string);
  await expect(page).toHaveURL(new RegExp(`/bookings/${booking.id}\\?payment=return$`));
  await expect(page.getByText(/Your payment is received/i)).toBeVisible();
  await expect(page.getByText(/The host still needs to confirm/i)).toBeVisible();
});

test("Safepay delivering the same confirmation twice changes nothing", async ({ context, request }) => {
  const booking = await createBooking(context, APP_URL, fixtures);
  await initiatePayment(context, APP_URL, booking.id);
  const tracker = fake.trackers[0];
  const event = { type: "payment.succeeded", tracker, bookingId: booking.id, amountPkr: booking.total } as const;

  const first = await postSafepayWebhook(request, event);
  expect(first.status()).toBe(200);
  expect(await first.json()).not.toHaveProperty("duplicate");
  const afterFirst = await onlyBooking();
  const notifications = await countNotifications(pool, [fixtures.studentId, fixtures.ownerId]);

  const second = await postSafepayWebhook(request, event);
  expect(second.status()).toBe(200);
  expect(await second.json()).toMatchObject({ received: true, duplicate: true });

  expect(await onlyBooking()).toEqual(afterFirst);
  expect(await countNotifications(pool, [fixtures.studentId, fixtures.ownerId])).toBe(notifications);
});

test("a failed payment can be retried from the booking page with a new checkout, and then paid", async ({ context, page, request }) => {
  await stubSafepayCheckoutPage(page);
  const booking = await createBooking(context, APP_URL, fixtures);
  await initiatePayment(context, APP_URL, booking.id);
  const firstTracker = fake.trackers[0];

  const failure = await postSafepayWebhook(request, { type: "payment.failed", tracker: firstTracker, bookingId: booking.id, amountPkr: booking.total });
  expect(failure.status()).toBe(200);
  expect(await onlyBooking()).toMatchObject({ status: "PENDING", paymentStatus: "FAILED", transactionId: firstTracker });

  // The student sees the failure and can try again.
  await page.goto(`/bookings/${booking.id}`);
  await expect(page.getByText("Payment failed")).toBeVisible();
  await page.getByRole("button", { name: "Pay now", exact: true }).click();
  await page.waitForURL(/getsafepay\.com\/embedded\//);

  const retryTracker = fake.trackers[1];
  expect(retryTracker).toBeTruthy();
  expect(retryTracker).not.toBe(firstTracker);
  expect(new URL(page.url()).searchParams.get("tracker")).toBe(retryTracker);

  const confirmation = await postSafepayWebhook(request, { type: "payment.succeeded", tracker: retryTracker, bookingId: booking.id, amountPkr: booking.total });
  expect(confirmation.status()).toBe(200);
  expect(await onlyBooking()).toMatchObject({ paymentStatus: "PAID", transactionId: retryTracker });

  await page.goto(`/bookings/${booking.id}?payment=return`);
  await expect(page.getByText(/Your payment is received/i)).toBeVisible();
});

test("when Safepay is down the student sees an error, keeps the booking, and can retry", async ({ context, page }) => {
  await stubSafepayCheckoutPage(page);
  const booking = await createBooking(context, APP_URL, fixtures);
  await page.goto(`/bookings/${booking.id}`);

  fake.failNext(503);
  await page.getByRole("button", { name: "Pay now", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Payment setup failed." })).toBeVisible();
  expect(await onlyBooking()).toMatchObject({ status: "PENDING", paymentStatus: "PENDING", transactionId: null });
  expect(await countSeatHolds(pool, booking.id)).toBe(1);

  // Safepay is back.
  await page.getByRole("button", { name: "Pay now", exact: true }).click();
  await page.waitForURL(/getsafepay\.com\/embedded\//);
  expect(new URL(page.url()).searchParams.get("tracker")).toBe(fake.trackers[0]);
});

test("confirmations that are forged, mismatched or incomplete never mark a booking paid", async ({ context, request }) => {
  const booking = await createBooking(context, APP_URL, fixtures);
  await initiatePayment(context, APP_URL, booking.id);
  const tracker = fake.trackers[0];
  const valid = { type: "payment.succeeded", tracker, bookingId: booking.id, amountPkr: booking.total } as const;

  // Not from Safepay: wrong signature, or none at all.
  const forged = await postSafepayWebhook(request, valid, { signWith: "not-the-webhook-secret" });
  expect(forged.status()).toBe(401);
  expect(await forged.json()).toEqual({ error: "Invalid signature." });
  const unsigned = await request.post("/api/payment/webhook", { data: buildSafepayWebhook(valid).body, headers: { "content-type": "application/json" } });
  expect(unsigned.status()).toBe(401);

  // Signed, but for another merchant.
  const otherMerchant = await postSafepayWebhook(request, { ...valid, merchantApiKey: "sec_some_other_merchant" });
  expect(otherMerchant.status()).toBe(401);
  expect(await otherMerchant.json()).toEqual({ error: "Merchant key mismatch." });

  // Signed and ours, but not a completed payment for this booking.
  for (const wrong of [{ amountPkr: booking.total - 1 }, { amountPkr: booking.total + 1 }, { currency: "USD" }]) {
    const response = await postSafepayWebhook(request, { ...valid, ...wrong });
    expect(response.status(), JSON.stringify(wrong)).toBe(400);
    expect(await response.json()).toMatchObject({ error: expect.stringContaining("held for reconciliation") });
  }
  const unfinished = await postSafepayWebhook(request, { ...valid, state: "TRACKER_STARTED" });
  expect(unfinished.status()).toBe(400);
  const unknownBooking = await postSafepayWebhook(request, { ...valid, bookingId: "cdoesnotexist000000000001" });
  expect(unknownBooking.status()).toBe(404);

  // None of it moved the booking.
  expect(await onlyBooking()).toMatchObject({ status: "PENDING", paymentStatus: "PENDING", transactionId: tracker });
  expect(await countSeatHolds(pool, booking.id)).toBe(1);
});

test("an abandoned checkout is cancelled after 30 minutes and frees its bed; a payment that arrives late reinstates it", async ({ context, request }) => {
  const abandoned = await createBooking(context, APP_URL, fixtures);
  await initiatePayment(context, APP_URL, abandoned.id);
  const abandonedTracker = fake.trackers[0];
  const recent = await createBooking(context, APP_URL, fixtures);

  await ageBooking(pool, abandoned.id, 31);
  await ageBooking(pool, recent.id, 10);

  // The job only answers to the cron credential.
  expect((await request.post("/api/cron/cancel-abandoned-payments")).status()).toBe(401);
  expect((await request.post("/api/cron/cancel-abandoned-payments", { headers: { authorization: "Bearer not-the-cron-secret" } })).status()).toBe(401);
  expect((await runCleanupJob(request, "cancel-abandoned-payments")).status()).toBe(200);

  // Only the one past 30 minutes is cancelled; its bed is free again.
  const [afterCleanup, recentAfter] = [await rowFor(abandoned.id), await rowFor(recent.id)];
  expect(afterCleanup).toMatchObject({ status: "CANCELLED", paymentStatus: "FAILED" });
  expect(recentAfter).toMatchObject({ status: "PENDING", paymentStatus: "PENDING" });
  expect(await countSeatHolds(pool, abandoned.id)).toBe(0);
  expect(await countSeatHolds(pool, recent.id)).toBe(1);

  // The student had actually paid at Safepay: the confirmation arrives after the cancellation.
  const late = await postSafepayWebhook(request, { type: "payment.succeeded", tracker: abandonedTracker, bookingId: abandoned.id, amountPkr: abandoned.total });
  expect(late.status()).toBe(200);
  expect(await late.json()).toMatchObject({ received: true, latePaymentOutcome: "REINSTATED" });

  expect(await rowFor(abandoned.id)).toMatchObject({ status: "PENDING", paymentStatus: "PAID", transactionId: abandonedTracker });
  expect(await countSeatHolds(pool, abandoned.id)).toBe(1);
  expect(await findLatePaymentResolutions(pool, abandoned.id)).toEqual([
    { providerTracker: abandonedTracker, reason: "ABANDONED_CHECKOUT", outcome: "REINSTATED", amount: abandoned.total, currency: "PKR" },
  ]);
});

async function rowFor(bookingId: string) {
  const row = (await findBookings(pool, fixtures.hostelId)).find((booking) => booking.id === bookingId);
  expect(row, `booking ${bookingId}`).toBeTruthy();
  return row as NonNullable<typeof row>;
}
