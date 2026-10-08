import { afterEach, describe, expect, it, vi } from "vitest";
import crypto from "crypto";
import { parseJazzCashCallback } from "./jazzcash";

const INTEGRITY_SALT = "test_integrity_salt";

afterEach(() => vi.unstubAllEnvs());

function signJazzCashParams(params: Record<string, string>) {
  const values = Object.keys(params)
    .filter((key) => key !== "pp_SecureHash" && params[key] !== "")
    .sort()
    .map((key) => params[key]);
  const message = [INTEGRITY_SALT, ...values].join("&");
  return crypto.createHmac("sha256", INTEGRITY_SALT).update(message).digest("hex").toUpperCase();
}

describe("parseJazzCashCallback", () => {
  it("validates a configured callback signature and parses the paisa amount", () => {
    vi.stubEnv("JAZZCASH_INTEGRITY_SALT", INTEGRITY_SALT);
    const params = {
      pp_Amount: "1200000",
      pp_ResponseCode: "000",
      pp_ResponseMessage: "Success",
      pp_TxnRefNo: "T123456",
    };

    const result = parseJazzCashCallback({ ...params, pp_SecureHash: signJazzCashParams(params) });
    expect(result).toMatchObject({ success: true, txnRefNo: "T123456", amount: 12000 });
  });

  it("fails closed when the integrity salt is missing", () => {
    vi.stubEnv("JAZZCASH_INTEGRITY_SALT", "");
    expect(() => parseJazzCashCallback({ pp_SecureHash: "A".repeat(64) })).toThrow("integrity salt is required");
  });

  it("rejects malformed and tampered hashes", () => {
    vi.stubEnv("JAZZCASH_INTEGRITY_SALT", INTEGRITY_SALT);
    const params = { pp_Amount: "1200000", pp_ResponseCode: "000", pp_TxnRefNo: "T123456" };
    expect(() => parseJazzCashCallback({ ...params, pp_SecureHash: "bad" })).toThrow("invalid secure hash format");
    expect(() => parseJazzCashCallback({ ...params, pp_SecureHash: "0".repeat(64) })).toThrow("secure hash mismatch");
  });
});
