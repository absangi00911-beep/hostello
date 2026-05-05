/**
 * EasyPaisa payment integration.
 *
 * Flow: server builds AES-encrypted hash → client POSTs a hidden form to
 * EasyPaisa TPG → user pays → EasyPaisa POSTs back to /api/payment/callback
 *
 * Required env vars:
 *   EASYPAISA_STORE_ID    — from EasyPaisa merchant portal
 *   EASYPAISA_HASH_KEY    — from EasyPaisa merchant portal (16-char AES key)
 *   EASYPAISA_ENV         — "sandbox" | "production"  (default: sandbox)
 */

import crypto from "crypto";
import { getAppUrl } from "@/lib/app-url";

// ── Config ────────────────────────────────────────────────────────────────────

function getConfig() {
  return {
    storeId: process.env.EASYPAISA_STORE_ID ?? "",
    hashKey: process.env.EASYPAISA_HASH_KEY ?? "",
    env: (process.env.EASYPAISA_ENV ?? "sandbox") as "sandbox" | "production",
  };
}

function getCheckoutUrl(env: string): string {
  return env === "production"
    ? "https://easypaisa.com.pk/tpg/"
    : "https://easypaisasandbox.pk/tpg/";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * AES-128-ECB encryption used by EasyPaisa for the encryptedHashRequest field.
 *
 * Key rules:
 *   - Must be exactly 16 bytes; zero-pad or truncate as needed.
 *   - Node's crypto expects a raw Buffer — not hex or base64.
 */
function aes128Encrypt(plaintext: string, key: string): string {
  const keyBuf = Buffer.alloc(16);
  Buffer.from(key, "utf8").copy(keyBuf, 0, 0, Math.min(key.length, 16));

  const cipher = crypto.createCipheriv("aes-128-ecb", keyBuf, null);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  return encrypted.toString("base64");
}

/** Format a Date as YYYYMMDDHHMMSS (UTC). */
function formatTimestamp(d: Date): string {
  return [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, "0"),
    String(d.getUTCDate()).padStart(2, "0"),
    String(d.getUTCHours()).padStart(2, "0"),
    String(d.getUTCMinutes()).padStart(2, "0"),
    String(d.getUTCSeconds()).padStart(2, "0"),
  ].join("");
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface EasypaisaSession {
  /** URL the browser should POST the form to. */
  formUrl: string;
  /** Hidden form fields, including the AES-encrypted hash. */
  params: Record<string, string>;
}

export function createEasypaisaSession({
  bookingId,
  amount,
  orderId,
  customerEmail,
  appUrl = getAppUrl(),
}: {
  bookingId: string;
  /** Amount in PKR (e.g. 8500). Sent as "8500.00". */
  amount: number;
  orderId: string;
  customerEmail: string;
  appUrl?: string;
}): EasypaisaSession {
  const config = getConfig();

  if (!config.storeId || !config.hashKey) {
    throw new Error(
      "EasyPaisa is not configured. Set EASYPAISA_STORE_ID and EASYPAISA_HASH_KEY.",
    );
  }

  const origin     = appUrl.replace(/\/+$/, "");
  const timestamp  = formatTimestamp(new Date());
  const amountStr  = amount.toFixed(2);
  const postBackURL = `${origin}/api/payment/callback?provider=easypaisa&bookingId=${bookingId}`;

  /**
   * EasyPaisa hash request string.
   * Keys must appear in this exact alphabetical order per the EasyPaisa TPG spec.
   * The encrypted version of this string is sent as encryptedHashRequest.
   */
  const hashRequest = [
    `amount=${amountStr}`,
    `email=${customerEmail}`,
    `orderRefNum=${orderId}`,
    `paymentMethod=MA`,
    `postBackURL=${postBackURL}`,
    `storeId=${config.storeId}`,
    `timeStamp=${timestamp}`,
  ].join("&");

  const encryptedHashRequest = aes128Encrypt(hashRequest, config.hashKey);

  const params: Record<string, string> = {
    storeId:                config.storeId,
    amount:                 amountStr,
    postBackURL,
    orderRefNum:            orderId,
    expiryDate:             "", // optional; leave blank for default (1 day)
    autoRedirect:           "0",
    timeStamp:              timestamp,
    paymentMethod:          "MA",       // MA = Mobile Account
    supportedPaymentModes:  "MA,MA_OTC",
    email:                  customerEmail,
    merchantPaymentMethod:  "MA",
    encryptedHashRequest,
  };

  return { formUrl: getCheckoutUrl(config.env), params };
}

// ── Callback parsing ──────────────────────────────────────────────────────────

export interface EasypaisaCallbackResult {
  success: boolean;
  orderRefNum: string;
  transactionId: string;
  /** Amount in PKR as returned by EasyPaisa. */
  amount: number;
  responseCode: string;
  responseMessage: string;
}

/**
 * Parse EasyPaisa's POST-back callback.
 *
 * EasyPaisa does NOT include a verifiable HMAC in the callback response,
 * so we rely on:
 *   1. Checking responseCode "0000" for success.
 *   2. Verifying orderRefNum matches the expected bookingId (prevents replay attacks).
 *   3. Cross-checking the amount against the booking record in the caller.
 *
 * Never mark a booking paid based solely on the callback — always verify
 * the amount server-side against the stored booking.total.
 *
 * @param data - Callback data from EasyPaisa
 * @param expectedBookingId - The bookingId from the URL; must match data.orderRefNum
 */
export function parseEasypaisaCallback(
  data: Record<string, string>,
  expectedBookingId: string,
): EasypaisaCallbackResult {
  // Verify orderRefNum matches the booking we expect.
  // This prevents replay attacks where an attacker uses a valid callback for a different booking.
  if (data.orderRefNum !== expectedBookingId) {
    return {
      success: false,
      orderRefNum: data.orderRefNum ?? "",
      transactionId: data.TransactionID ?? data.transactionId ?? "",
      amount: parseFloat(data.amount ?? "0"),
      responseCode: "9999",
      responseMessage: "Order reference does not match booking ID (possible replay attack)",
    };
  }

  // EasyPaisa success code is "0000"; anything else is a failure.
  const responseCode = data.responseCode ?? data.Status ?? "";
  const success      = responseCode === "0000";

  return {
    success,
    orderRefNum:     data.orderRefNum       ?? "",
    transactionId:   data.TransactionID     ?? data.transactionId ?? "",
    amount:          parseFloat(data.amount ?? "0"),
    responseCode,
    responseMessage: data.responseMessage   ?? (success ? "Payment successful" : "Payment failed"),
  };
}