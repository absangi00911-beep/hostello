// Path: src/lib/safepay.ts

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

function getSafepayApiKey() {
  return process.env.SAFEPAY_API_KEY ?? "";
}

function getSafepayEnvironment(): "sandbox" | "production" {
  return process.env.NEXT_PUBLIC_SAFEPAY_ENV === "production" ? "production" : "sandbox";
}

/** The application stores whole PKR; Safepay APIs use the lowest currency unit. */
export function toSafepayMinorUnits(amountInPkr: number): number {
  if (!Number.isSafeInteger(amountInPkr) || amountInPkr <= 0) {
    throw new Error("Safepay amount must be a positive whole-PKR safe integer.");
  }

  const minorUnits = amountInPkr * 100;
  if (!Number.isSafeInteger(minorUnits)) {
    throw new Error("Safepay amount exceeds the supported integer range.");
  }
  return minorUnits;
}

export interface SafepaySession {
  token: string;
  redirectUrl: string;
}

export async function createCheckoutLink({
  bookingId,
  token,
  orderId,
  appUrl = getAppUrl(),
  redirectPath,
  cancelPath,
  source = "hosted",
}: {
  bookingId: string;
  token: string;
  orderId: string;
  appUrl?: string;
  redirectPath?: string;
  cancelPath?: string;
  source?: "hosted" | "mobile";
}): Promise<SafepaySession> {
  const baseUrl = getSafepayBaseUrl();
  const secret = getSafepaySecret();
  if (!secret) throw new Error("Safepay is not configured. Set SAFEPAY_SECRET.");

  const origin = appUrl.replace(/\/+$/, "");
  const resolveUrl = (path: string) =>
    /^[a-z][a-z\d+.-]*:/i.test(path) ? path : new URL(path, `${origin}/`).toString();
  const redirectUrl = resolveUrl(redirectPath ?? `/booking/${bookingId}/confirmation?payment=return`);
  const cancelUrl = resolveUrl(cancelPath ?? `/booking/${bookingId}/payment?payment=cancelled`);

  const authResponse = await fetch(`${baseUrl}/client/passport/v1/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SFPY-MERCHANT-SECRET": secret,
    },
    body: "{}",
  });

  if (!authResponse.ok) {
    const text = await authResponse.text();
    throw new Error(`Safepay checkout authentication failed: ${text}`);
  }

  const authData = await authResponse.json();
  const tbt = authData?.data as string | undefined;
  if (!tbt) throw new Error("No authentication token in Safepay response");

  const environment = getSafepayEnvironment();
  const checkoutBase = environment === "production"
    ? "https://getsafepay.com/embedded/"
    : "https://sandbox.api.getsafepay.com/embedded/";
  const checkoutUrl = new URL(checkoutBase);
  checkoutUrl.search = new URLSearchParams({
    environment,
    tracker: token,
    tbt,
    source,
    order_id: orderId,
    redirect_url: redirectUrl,
    cancel_url: cancelUrl,
  }).toString();

  return { token, redirectUrl: checkoutUrl.toString() };
}

export async function createCheckoutSession({
  bookingId,
  amount,
  orderId,
  customerEmail,
  customerName,
  appUrl = getAppUrl(),
  redirectPath = `/booking/${bookingId}/confirmation?payment=return`,
  cancelPath,
  source = "hosted",
}: {
  bookingId: string;
  amount: number;
  orderId: string;
  customerEmail: string;
  customerName: string;
  appUrl?: string;
  redirectPath?: string;
  cancelPath?: string;
  source?: "hosted" | "mobile";
}): Promise<SafepaySession> {
  const baseUrl = getSafepayBaseUrl();
  const secret = getSafepaySecret();
  const apiKey = getSafepayApiKey();
  if (!secret || !/^sec_[A-Za-z0-9_-]+$/.test(apiKey)) {
    throw new Error("Safepay is not configured. Set SAFEPAY_SECRET and SAFEPAY_API_KEY.");
  }

  // Callers pass whole PKR, matching the integer convention in our database.
  // Convert once here to Safepay's lowest-denomination units (paisa).
  const sessionResponse = await fetch(`${baseUrl}/order/payments/v3/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SFPY-MERCHANT-SECRET": secret,
    },
    body: JSON.stringify({
      merchant_api_key: apiKey,
      intent: "CYBERSOURCE",
      mode: "payment",
      entry_mode: "raw",
      currency: "PKR",
      amount: toSafepayMinorUnits(amount),
      metadata: { order_id: orderId },
      include_fees: false,
    }),
  });

  if (!sessionResponse.ok) {
    const text = await sessionResponse.text();
    throw new Error(`Safepay session creation failed: ${text}`);
  }

  const sessionData = await sessionResponse.json();
  const token = sessionData?.data?.tracker?.token as string | undefined;
  if (!token) throw new Error("No tracker token in Safepay session response");

  // Customer details are optional in the v3 flow. Avoid extra PII requests or
  // placing customer data in the checkout URL.
  void customerEmail;
  void customerName;
  return createCheckoutLink({
    bookingId,
    token,
    orderId,
    appUrl,
    redirectPath,
    cancelPath,
    source,
  });
}

const HEX_RE = /^[0-9a-f]+$/i;
const MAX_PREVIOUS_WEBHOOK_SECRET_GRACE_MS = 72 * 60 * 60 * 1000;

function getWebhookSigningSecrets(now = Date.now()): string[] {
  const currentSecret = process.env.SAFEPAY_WEBHOOK_SECRET ?? "";
  if (!currentSecret) return [];

  const secrets = [currentSecret];
  const previousSecret = process.env.SAFEPAY_WEBHOOK_SECRET_PREVIOUS ?? "";
  const previousUntilText = process.env.SAFEPAY_WEBHOOK_SECRET_PREVIOUS_UNTIL ?? "";
  const previousUntil = Date.parse(previousUntilText);
  const hasValidPreviousUntil =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(previousUntilText) &&
    Number.isFinite(previousUntil) &&
    new Date(previousUntil).toISOString() === previousUntilText;

  // Keep the prior key only for an explicit, bounded rotation window. This
  // allows already-queued events to drain without leaving an old key accepted
  // indefinitely if the environment variable is forgotten.
  if (
    previousSecret &&
    hasValidPreviousUntil &&
    previousUntil > now &&
    previousUntil - now <= MAX_PREVIOUS_WEBHOOK_SECRET_GRACE_MS &&
    previousSecret !== currentSecret
  ) {
    secrets.push(previousSecret);
  }

  return secrets;
}

export interface SafepayRefundResult {
  success: true;
  state: "TRACKER_REFUNDED";
  raw: unknown;
}

/**
 * Attempts a refund against Safepay for a previously-paid transaction.
 *
 * Endpoint sourced from the official @sfpy/node-core SDK
 * (github.com/getsafepay/node-core, src/resources/Order/Cancel.ts) on
 * 2026-08-06, after apidocs.getsafepay.com again proved unreachable from
 * outside a real browser session. The SDK's Cancel resource defines
 * refund/reverse/void as POST requests to
 * /order/payments/v3/{tracker}/refund|reversal|void — a different API
 * with the tracker passed as a URL path segment rather than a body field.
 * (The sibling `reverse` and `void` actions exist too; semantics vs. refund
 * aren't confirmed, so they're not used here.)
 *
 * The current Safepay refund guide documents amount/currency as the request
 * body and `data.tracker.state === "TRACKER_REFUNDED"` as the full-refund
 * response. Safepay expects minor units, so the helper converts whole PKR to
 * paisas. Do not treat any other 2xx response as a completed refund. The
 * merchant sandbox flow still needs an end-to-end confirmation before launch.
 *
 * Callers must not treat a thrown error here as proof the money wasn't
 * refunded, and must not treat a resolved promise as proof it was — always
 * pair this with a manual-confirmation path. See processRefund in
 * src/lib/refunds.ts, which does exactly that.
 */
export async function refundPayment({
  transactionId,
  amount,
}: {
  transactionId: string;
  amount: number;
}): Promise<SafepayRefundResult> {
  const baseUrl = getSafepayBaseUrl();
  const secret = getSafepaySecret();
  const timeoutSignal = AbortSignal.timeout(15_000);

  const res = await fetch(
    `${baseUrl}/order/payments/v3/${encodeURIComponent(transactionId)}/refund`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SFPY-MERCHANT-SECRET": secret,
      },
      body: JSON.stringify({
        amount: toSafepayMinorUnits(amount),
        currency: "PKR",
      }),
      signal: timeoutSignal,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Safepay refund failed: ${text}`);
  }

  const data = await res.json();
  const state = (data as { data?: { tracker?: { state?: unknown } } })?.data?.tracker?.state;
  if (state !== "TRACKER_REFUNDED") {
    throw new Error(
      `Safepay refund did not confirm a full refund (tracker state: ${typeof state === "string" ? state : "unknown"}).`,
    );
  }

  return { success: true, state, raw: data };
}

/**
 * Verify the HMAC-SHA512 signature Safepay currently documents for webhooks.
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
  // SHA-512 produces 64 bytes represented as exactly 128 hexadecimal chars.
  if (signature.length !== 128 || !HEX_RE.test(signature)) return false;

  const secrets = getWebhookSigningSecrets();
  if (secrets.length === 0) return false;
  const encoder = new TextEncoder();

  try {
    const { timingSafeEqual } = await import("crypto");
    const sigBuf = Buffer.from(signature, "hex");
    if (sigBuf.length !== 64) return false;

    let verified = false;
    for (const secret of secrets) {
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-512" },
        false,
        ["sign"],
      );
      const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
      const expected = Buffer.from(new Uint8Array(signed));
      // Compare every active key to avoid revealing which rotation key matched.
      verified = timingSafeEqual(sigBuf, expected) || verified;
    }

    return verified;
  } catch {
    return false;
  }
}
