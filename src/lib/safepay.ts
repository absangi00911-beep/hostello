/**
 * Safepay helper — Pakistan's cleanest payment gateway.
 * Docs: https://getsafepay.com/docs
 *
 * Environment variables needed:
 *   SAFEPAY_SECRET        — from Safepay dashboard (sandbox or live)
 *   SAFEPAY_WEBHOOK_SECRET — to verify webhook signatures
 *   NEXT_PUBLIC_SAFEPAY_ENV — "sandbox" | "production"
 */

import { getAppUrl } from "@/lib/app-url";

function getSafepayBaseUrl() {
  return process.env.NEXT_PUBLIC_SAFEPAY_ENV === "production"
    ? "https://api.getsafepay.com"
    : "https://sandbox.api.getsafepay.com";
}

function getSafepaySecret() {
  return process.env.SAFEPAY_SECRET ?? "";
}

export interface SafepaySession {
  token: string;
  redirectUrl: string;
}

export async function createCheckoutSession({
  bookingId,
  amount,
  orderId,
  customerEmail,
  customerName,
  appUrl = getAppUrl(),
}: {
  bookingId: string;
  amount: number;
  orderId: string;
  customerEmail: string;
  customerName: string;
  appUrl?: string;
}): Promise<SafepaySession> {
  const baseUrl = getSafepayBaseUrl();
  const secret = getSafepaySecret();
  const origin = appUrl.replace(/\/+$/, "");

  const payload = {
    client: secret,
    amount: Math.round(amount),
    currency: "PKR",
    order_id: orderId,
    source: "custom",
    cancel_url: `${origin}/bookings/${bookingId}?payment=cancelled`,
    redirect_url: `${origin}/payment/success?bookingId=${bookingId}`,
    webhook_url: `${origin}/api/payment/webhook`,
    customer: {
      email: customerEmail,
      name: customerName,
    },
  };

  const res = await fetch(`${baseUrl}/order/v1/init`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SFPY-MERCHANT-SECRET": secret,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Safepay session creation failed: ${text}`);
  }

  const data = await res.json();
  const token = data?.data?.token as string;
  if (!token) throw new Error("No token in Safepay response");

  const redirectUrl = `${baseUrl.replace("api.", "")}/checkout?token=${token}`;
  return { token, redirectUrl };
}

const HEX_RE = /^[0-9a-f]+$/i;

/**
 * Verify the HMAC-SHA256 signature Safepay sends on webhook calls.
 *
 * Security notes:
 * - The signature parameter is validated as a hex string before any Buffer
 *   operations; non-hex input (including empty strings) returns false rather
 *   than throwing a RangeError inside timingSafeEqual.
 * - Buffer lengths are compared before the timing-safe comparison to avoid a
 *   Node.js crash on mismatched lengths.
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
): Promise<boolean> {
  // Reject immediately if the signature is absent or not valid hex.
  if (!signature || !HEX_RE.test(signature)) return false;

  const secret =
    process.env.SAFEPAY_WEBHOOK_SECRET ?? getSafepaySecret();
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );

  const expected = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  try {
    const { timingSafeEqual } = await import("crypto");
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");

    // timingSafeEqual throws if buffers have different lengths.
    // The length check here prevents that and avoids a timing leak.
    if (sigBuf.length === 0 || sigBuf.length !== expBuf.length) return false;

    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}