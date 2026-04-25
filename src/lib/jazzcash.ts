/**
 * JazzCash payment integration.
 *
 * Flow: server builds signed form params → client POSTs a hidden form to
 * JazzCash checkout → user pays → JazzCash POSTs back to /api/payment/callback
 *
 * Docs: https://sandbox.jazzcash.com.pk/MerchantPortal (login required)
 *
 * Required env vars:
 *   JAZZCASH_MERCHANT_ID      — from JazzCash merchant portal
 *   JAZZCASH_PASSWORD         — from JazzCash merchant portal
 *   JAZZCASH_INTEGRITY_SALT   — from JazzCash merchant portal
 *   JAZZCASH_ENV              — "sandbox" | "production"  (default: sandbox)
 */

import crypto from "crypto";
import { getAppUrl } from "@/lib/app-url";

// ── Config ────────────────────────────────────────────────────────────────────

interface JazzCashConfig {
  merchantId: string;
  password: string;
  integritySalt: string;
  env: "sandbox" | "production";
}

function getConfig(): JazzCashConfig {
  return {
    merchantId:     process.env.JAZZCASH_MERCHANT_ID     ?? "",
    password:       process.env.JAZZCASH_PASSWORD        ?? "",
    integritySalt:  process.env.JAZZCASH_INTEGRITY_SALT  ?? "",
    env: (process.env.JAZZCASH_ENV as "sandbox" | "production") ?? "sandbox",
  };
}

function getCheckoutUrl(env: string): string {
  return env === "production"
    ? "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/"
    : "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format a Date as YYYYMMDDHHMMSS (UTC). JazzCash expects this format. */
function formatDateTime(d: Date): string {
  return [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, "0"),
    String(d.getUTCDate()).padStart(2, "0"),
    String(d.getUTCHours()).padStart(2, "0"),
    String(d.getUTCMinutes()).padStart(2, "0"),
    String(d.getUTCSeconds()).padStart(2, "0"),
  ].join("");
}

/**
 * Compute the JazzCash HMAC-SHA256 secure hash.
 *
 * Algorithm (per JazzCash docs):
 *   1. Collect all pp_ params except pp_SecureHash itself; skip blank values.
 *   2. Sort keys alphabetically.
 *   3. Build message = IntegritySalt & value1 & value2 & … (values only, sorted by key).
 *   4. HMAC-SHA256(message, key=IntegritySalt) → uppercase hex.
 */
function computeSecureHash(
  params: Record<string, string>,
  integritySalt: string,
): string {
  const sortedValues = Object.keys(params)
    .filter((k) => k !== "pp_SecureHash" && (params[k] ?? "") !== "")
    .sort()
    .map((k) => params[k]);

  const message = [integritySalt, ...sortedValues].join("&");

  return crypto
    .createHmac("sha256", integritySalt)
    .update(message)
    .digest("hex")
    .toUpperCase();
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface JazzCashSession {
  /** URL the browser should POST the form to. */
  formUrl: string;
  /** Hidden form fields, including the computed pp_SecureHash. */
  params: Record<string, string>;
}

export function createJazzCashSession({
  bookingId,
  amount,
  orderId,
  description,
  appUrl = getAppUrl(),
}: {
  bookingId: string;
  /** Amount in PKR. Internally converted to paisa (×100). */
  amount: number;
  orderId: string;
  description: string;
  appUrl?: string;
}): JazzCashSession {
  const config = getConfig();

  if (!config.merchantId || !config.password || !config.integritySalt) {
    throw new Error(
      "JazzCash is not configured. Set JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, and JAZZCASH_INTEGRITY_SALT.",
    );
  }

  const now    = new Date();
  const expiry = new Date(now.getTime() + 60 * 60 * 1000); // 1-hour window

  const txnDateTime = formatDateTime(now);
  // Reference format: T<datetime><4 random hex chars> — must be unique per txn
  const txnRef = `T${txnDateTime}${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

  const origin    = appUrl.replace(/\/+$/, "");
  const returnUrl = `${origin}/api/payment/callback?provider=jazzcash&bookingId=${bookingId}`;

  const params: Record<string, string> = {
    pp_Version:             "1.1",
    pp_TxnType:             "MWALLET",
    pp_Language:            "EN",
    pp_MerchantID:          config.merchantId,
    pp_SubMerchantID:       "",
    pp_Password:            config.password,
    pp_BankID:              "TBANK",
    pp_ProductID:           "RETL",
    pp_TxnRefNo:            txnRef,
    pp_Amount:              Math.round(amount * 100).toString(), // PKR → paisa
    pp_TxnCurrency:         "PKR",
    pp_TxnDateTime:         txnDateTime,
    pp_BillReference:       `BK${orderId.slice(-8).toUpperCase()}`,
    pp_Description:         description.slice(0, 80),
    pp_TxnExpiryDateTime:   formatDateTime(expiry),
    pp_ReturnURL:           returnUrl,
    pp_SecureHash:          "", // computed below
  };

  params.pp_SecureHash = computeSecureHash(params, config.integritySalt);

  return { formUrl: getCheckoutUrl(config.env), params };
}

// ── Callback parsing ──────────────────────────────────────────────────────────

export interface JazzCashCallbackResult {
  success: boolean;
  txnRefNo: string;
  responseCode: string;
  responseMessage: string;
  /** Amount in PKR (converted from paisa). */
  amount: number;
}

/**
 * Verify JazzCash's callback signature and return the parsed result.
 * Throws on signature mismatch to prevent tampering.
 */
export function parseJazzCashCallback(
  data: Record<string, string>,
): JazzCashCallbackResult {
  const config = getConfig();

  const received = (data.pp_SecureHash ?? "").toUpperCase();
  const expected = computeSecureHash(data, config.integritySalt);

  if (!received || received !== expected) {
    throw new Error("JazzCash: secure hash mismatch — possible tampering");
  }

  return {
    // "000" is the JazzCash success response code
    success:         data.pp_ResponseCode === "000",
    txnRefNo:        data.pp_TxnRefNo        ?? "",
    responseCode:    data.pp_ResponseCode    ?? "",
    responseMessage: data.pp_ResponseMessage ?? "Unknown",
    amount:          parseInt(data.pp_Amount ?? "0", 10) / 100,
  };
}