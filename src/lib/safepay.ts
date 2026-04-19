/**
 * Safepay helper — Pakistan's cleanest payment gateway.
 * Docs: https://getsafepay.com/docs
 *
 * Environment variables needed:
 *   SAFEPAY_SECRET        — from Safepay dashboard (sandbox or live)
 *   SAFEPAY_WEBHOOK_SECRET — to verify webhook signatures
 *   NEXT_PUBLIC_SAFEPAY_ENV — "sandbox" | "production"
 */

const BASE = process.env.NEXT_PUBLIC_SAFEPAY_ENV === "production"
  ? "https://api.getsafepay.com"
  : "https://sandbox.api.getsafepay.com";

const SECRET = process.env.SAFEPAY_SECRET ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
}: {
  bookingId:     string;
  amount:        number;
  orderId:       string;
  customerEmail: string;
  customerName:  string;
}): Promise<SafepaySession> {
  // Safepay uses integer amounts in PKR (no paisa)
  const payload = {
    client:           SECRET,
    amount:           Math.round(amount),
    currency:         "PKR",
    order_id:         orderId,
    source:           "custom",
    cancel_url:       `${APP_URL}/bookings/${bookingId}?payment=cancelled`,
    redirect_url:     `${APP_URL}/payment/success?bookingId=${bookingId}`,
    webhook_url:      `${APP_URL}/api/payment/webhook`,
    customer: {
      email: customerEmail,
      name:  customerName,
    },
  };

  const res = await fetch(`${BASE}/order/v1/init`, {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SFPY-MERCHANT-SECRET": SECRET,
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

  const redirectUrl = `${BASE.replace("api.", "")}/checkout?token=${token}`;

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
  const secret = process.env.SAFEPAY_WEBHOOK_SECRET ?? SECRET;
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

  return hex === signature;
}
