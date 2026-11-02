import { describe, expect, it } from "vitest";
import {
  parseVerificationStatus,
  validateVerificationFile,
} from "./StudentVerificationPage";

describe("parseVerificationStatus", () => {
  it("reads each valid status", () => {
    for (const status of ["NONE", "PENDING", "APPROVED", "REJECTED"]) {
      expect(parseVerificationStatus({ data: { verificationStatus: status } })).toBe(status);
    }
  });

  it("rejects missing or unknown values", () => {
    expect(parseVerificationStatus({ data: {} })).toBeNull();
    expect(parseVerificationStatus({ data: { verificationStatus: "MAYBE" } })).toBeNull();
    expect(parseVerificationStatus(null)).toBeNull();
  });
});

describe("validateVerificationFile", () => {
  it("accepts supported types under the size limit", () => {
    expect(validateVerificationFile({ type: "application/pdf", size: 1000 })).toBeNull();
    expect(validateVerificationFile({ type: "image/png", size: 3_999_999 })).toBeNull();
  });

  it("rejects missing, unsupported, empty and oversized files", () => {
    expect(validateVerificationFile(null)).toMatch(/Choose/);
    expect(validateVerificationFile({ type: "text/plain", size: 10 })).toMatch(/JPEG/);
    expect(validateVerificationFile({ type: "image/png", size: 0 })).toMatch(/empty/);
    expect(validateVerificationFile({ type: "image/png", size: 4_000_001 })).toMatch(/too large/);
  });
});
