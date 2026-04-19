import assert from "node:assert/strict";
import test from "node:test";

import { createCheckoutSession } from "./safepay";

test("createCheckoutSession uses the request origin for payment callback URLs", async () => {
  const previousSecret = process.env.SAFEPAY_SECRET;
  const previousEnv = process.env.NEXT_PUBLIC_SAFEPAY_ENV;

  process.env.SAFEPAY_SECRET = "sk_test";
  process.env.NEXT_PUBLIC_SAFEPAY_ENV = "sandbox";

  let payload: Record<string, string> | undefined;
  const originalFetch = global.fetch;

  global.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    payload = JSON.parse(String(init?.body));

    return new Response(
      JSON.stringify({ data: { token: "tok_test" } }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }) as typeof fetch;

  const result = await createCheckoutSession({
    bookingId: "booking_123",
    amount: 25_000,
    orderId: "order_123",
    customerEmail: "student@example.com",
    customerName: "Hostel Student",
    appUrl: "https://hostello.vercel.app/",
  } as never);

  assert.equal(result.redirectUrl, "https://sandbox.getsafepay.com/checkout?token=tok_test");
  assert.equal(payload?.cancel_url, "https://hostello.vercel.app/bookings/booking_123?payment=cancelled");
  assert.equal(payload?.redirect_url, "https://hostello.vercel.app/payment/success?bookingId=booking_123");
  assert.equal(payload?.webhook_url, "https://hostello.vercel.app/api/payment/webhook");

  global.fetch = originalFetch;

  if (previousSecret === undefined) {
    delete process.env.SAFEPAY_SECRET;
  } else {
    process.env.SAFEPAY_SECRET = previousSecret;
  }

  if (previousEnv === undefined) {
    delete process.env.NEXT_PUBLIC_SAFEPAY_ENV;
  } else {
    process.env.NEXT_PUBLIC_SAFEPAY_ENV = previousEnv;
  }
});
