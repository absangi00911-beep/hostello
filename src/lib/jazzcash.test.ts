import { afterEach, describe, expect, it, vi } from "vitest";
import crypto from "crypto";
import { createJazzCashSession, parseJazzCashCallback } from "./jazzcash";

const INTEGRITY_SALT = "test_integrity_salt";

afterEach(() => vi.unstubAllEnvs());

function signJazzCashParams(params: Record<string, string>) {
  const values = Object.keys(params)
    .filter((key) => key.startsWith("pp_") && key !== "pp_SecureHash" && params[key] !== "")
    .sort()
    .map((key) => params[key]);
  const message = [INTEGRITY_SALT, ...values].join("&");
  return crypto.createHmac("sha256", INTEGRITY_SALT).update(message).digest("hex").toUpperCase();
}

function createSignedCallback(bookingId: string) {
  vi.stubEnv("JAZZCASH_MERCHANT_ID", "test-merchant");
  vi.stubEnv("JAZZCASH_PASSWORD", "test-password");
  vi.stubEnv("JAZZCASH_INTEGRITY_SALT", INTEGRITY_SALT);

  const checkout = createJazzCashSession({
    bookingId,
    amount: 12_000,
    description: "Test booking",
    appUrl: "https://hostello.pk",
  });
  const params = {
    pp_Amount: "1200000",
    pp_BillReference: checkout.params.pp_BillReference,
    pp_ResponseCode: "000",
    pp_ResponseMessage: "Success",
    pp_TxnRefNo: "T123456",
    provider: "jazzcash",
    bookingId,
  };

  return { ...params, pp_SecureHash: signJazzCashParams(params) };
}

describe("parseJazzCashCallback", () => {
  it("validates the signed booking reference while ignoring unsigned callback URL metadata", () => {
    const params = createSignedCallback("booking-1");

    const result = parseJazzCashCallback(params, "booking-1");
    expect(result).toMatchObject({ success: true, txnRefNo: "T123456", amount: 12000 });
  });

  it("rejects a valid signed callback when its bill reference belongs to another booking", () => {
    const params = createSignedCallback("booking-1");

    expect(() => parseJazzCashCallback(params, "booking-2")).toThrow("booking reference mismatch");
  });

  it("fails closed when the integrity salt is missing", () => {
    vi.stubEnv("JAZZCASH_INTEGRITY_SALT", "");
    expect(() => parseJazzCashCallback({ pp_SecureHash: "A".repeat(64) }, "booking-1"))
      .toThrow("integrity salt is required");
  });

  it("rejects malformed and tampered hashes", () => {
    vi.stubEnv("JAZZCASH_INTEGRITY_SALT", INTEGRITY_SALT);
    const params = { pp_Amount: "1200000", pp_ResponseCode: "000", pp_TxnRefNo: "T123456" };
    expect(() => parseJazzCashCallback({ ...params, pp_SecureHash: "bad" }, "booking-1"))
      .toThrow("invalid secure hash format");
    expect(() => parseJazzCashCallback({ ...params, pp_SecureHash: "0".repeat(64) }, "booking-1"))
      .toThrow("secure hash mismatch");
  });
});
