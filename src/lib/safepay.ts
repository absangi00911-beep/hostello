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
  token:      string;
  redirectUrl: string;
}

/**
 * Create a Safepay checkout session.
 * Returns a token and the URL to redirect the user to.
 */
export async function createCheckoutSession({
  bookingId,
  amount,       // in PKR
  orderId,
  customerEmail,
  customerName,
  appUrl = getAppUrl(),
}: {
  bookingId:     string;
  amount:        number;
  orderId:       string;
  customerEmail: string;
  customerName:  string;
  appUrl?: string;
}): Promise<SafepaySession> {
  const baseUrl = getSafepayBaseUrl();
  const secret = getSafepaySecret();
  const origin = appUrl.replace(/\/+$/, "");

  // Safepay uses integer amounts in PKR (no paisa)
  const payload = {
    client:           secret,
    amount:           Math.round(amount),
    currency:         "PKR",
    order_id:         orderId,
    source:           "custom",
    cancel_url:       `${origin}/bookings/${bookingId}?payment=cancelled`,
    redirect_url:     `${origin}/payment/success?bookingId=${bookingId}`,
    webhook_url:      `${origin}/api/payment/webhook`,
    customer: {
      email: customerEmail,
      name:  customerName,
    },
  };

  const res = await fetch(`${baseUrl}/order/v1/init`, {
    method:  "POST",
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

  // Safepay returns { data: { token: "...", tracker: "..." } }
  const token = data?.data?.token as string;
  if (!token) throw new Error("No token in Safepay response");

  const redirectUrl = `${baseUrl.replace("api.", "")}/checkout?token=${token}`;

  return { token, redirectUrl };
}

/**
 * Verify the HMAC signature Safepay sends on webhook calls.
 * Returns false if the signature doesn't match — reject the request.
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string
): Promise<boolean> {
  const secret = process.env.SAFEPAY_WEBHOOK_SECRET ?? getSafepaySecret();
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const hex    = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Use timing-safe comparison to prevent timing attacks on webhook signature
  const { timingSafeEqual } = await import("crypto");
  const sigBuffer = Buffer.from(signature, "hex");
  const hexBuffer = Buffer.from(hex, "hex");
  
  if (sigBuffer.length !== hexBuffer.length) {
    return false;
  }
  
  try {
    return timingSafeEqual(sigBuffer, hexBuffer);
  } catch {
    return false;
  }
}
