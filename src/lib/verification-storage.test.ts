import { describe, expect, it } from "vitest";
import {
  hasVerificationFileSignature,
  findExpiredVerificationUploadKeys,
  isVerificationObjectKey,
  isVerificationUploadKey,
  verificationContentTypeForKey,
} from "@/lib/verification-storage";

describe("private verification document validation", () => {
  it("binds object keys to one account and a generated file name", () => {
    const key = `student-verifications/user_123/${"a".repeat(32)}.pdf`;

    expect(isVerificationObjectKey(key, "user_123")).toBe(true);
    expect(isVerificationUploadKey(`student-verification-uploads/user_123/${"a".repeat(32)}.pdf`, "user_123")).toBe(true);
    expect(isVerificationUploadKey(key, "user_123")).toBe(false);
    expect(isVerificationObjectKey(key, "user_456")).toBe(false);
    expect(isVerificationObjectKey(`student-verifications/user_123/../${"a".repeat(32)}.pdf`, "user_123")).toBe(false);
    expect(isVerificationObjectKey(`student-verifications/user_123/${"a".repeat(32)}.html`, "user_123")).toBe(false);
  });

  it("accepts allowed file signatures and rejects MIME spoofing", () => {
    expect(hasVerificationFileSignature("image/jpeg", new Uint8Array([0xff, 0xd8, 0xff, 0x00]))).toBe(true);
    expect(hasVerificationFileSignature("image/png", new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
    expect(hasVerificationFileSignature("image/webp", new TextEncoder().encode("RIFF0000WEBP"))).toBe(true);
    expect(hasVerificationFileSignature("application/pdf", new TextEncoder().encode("%PDF-1.7"))).toBe(true);
    expect(hasVerificationFileSignature("application/pdf", new TextEncoder().encode("<html>"))).toBe(false);
    expect(hasVerificationFileSignature("image/png", new TextEncoder().encode("fake png"))).toBe(false);
  });

  it("derives only the expected raster and PDF response types from object keys", () => {
    expect(verificationContentTypeForKey(`student-verifications/user/${"a".repeat(32)}.jpg`)).toBe("image/jpeg");
    expect(verificationContentTypeForKey(`student-verifications/user/${"a".repeat(32)}.pdf`)).toBe("application/pdf");
    expect(verificationContentTypeForKey("student-verifications/user/document.svg")).toBeNull();
  });

  it("selects only well-formed temporary uploads older than the retention window", () => {
    const now = Date.now();
    const expiredKey = `student-verification-uploads/user/${"a".repeat(32)}.png`;
    const recentKey = `student-verification-uploads/user/${"b".repeat(32)}.png`;

    expect(findExpiredVerificationUploadKeys([
      { Key: expiredKey, LastModified: new Date(now - 61 * 60 * 1000) },
      { Key: recentKey, LastModified: new Date(now - 30 * 60 * 1000) },
      { Key: "student-verifications/user/old.pdf", LastModified: new Date(now - 2 * 60 * 60 * 1000) },
    ], now)).toEqual([expiredKey]);
  });
});
