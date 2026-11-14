import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ count: vi.fn(), send: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { hostel: { count: mocks.count } } }));
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = mocks.send;
  },
  DeleteObjectCommand: class {
    constructor(public input: unknown) {}
  },
}));

import {
  deleteLegacyPublicVerificationDocument,
  getLegacyPublicDocumentKey,
  isLegacyPublicDocumentUrl,
} from "@/lib/legacy-verification-docs";

const URL_OK = "https://pub-abc.r2.dev/hostels/1700000000-deadbeef-student_id.jpg";

beforeEach(() => {
  vi.stubEnv("R2_PUBLIC_URL", "https://pub-abc.r2.dev");
  vi.stubEnv("R2_ACCOUNT_ID", "acct");
  vi.stubEnv("R2_ACCESS_KEY_ID", "key");
  vi.stubEnv("R2_SECRET_ACCESS_KEY", "secret");
  vi.stubEnv("R2_BUCKET_NAME", "public-bucket");
  mocks.count.mockReset().mockResolvedValue(0);
  mocks.send.mockReset().mockResolvedValue({});
});
afterEach(() => vi.unstubAllEnvs());

describe("getLegacyPublicDocumentKey", () => {
  it("accepts only files directly under hostels/ on the configured public origin", () => {
    expect(getLegacyPublicDocumentKey(URL_OK)).toBe("hostels/1700000000-deadbeef-student_id.jpg");
    for (const value of [
      "https://other.r2.dev/hostels/a.jpg",
      "http://pub-abc.r2.dev/hostels/a.jpg",
      "https://pub-abc.r2.dev/hostels/../secret.jpg",
      "https://pub-abc.r2.dev/hostels/a/b.jpg",
      "https://pub-abc.r2.dev/other/a.jpg",
      "https://pub-abc.r2.dev/hostels/a.jpg?x=1",
      "student-verifications/u1/abc.jpg",
      "not a url",
      "",
      null,
      undefined,
    ]) {
      expect(getLegacyPublicDocumentKey(value), String(value)).toBeNull();
    }
    expect(isLegacyPublicDocumentUrl(URL_OK)).toBe(true);
  });

  it("matches nothing when no public URL is configured", () => {
    vi.stubEnv("R2_PUBLIC_URL", "");
    expect(getLegacyPublicDocumentKey(URL_OK)).toBeNull();
  });
});

describe("deleteLegacyPublicVerificationDocument", () => {
  it("deletes the object from the public bucket", async () => {
    expect(await deleteLegacyPublicVerificationDocument(URL_OK)).toBe(true);
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.send.mock.calls[0][0].input).toEqual({
      Bucket: "public-bucket",
      Key: "hostels/1700000000-deadbeef-student_id.jpg",
    });
  });

  it("refuses to delete anything that is not a legacy document URL", async () => {
    await expect(deleteLegacyPublicVerificationDocument("https://pub-abc.r2.dev/hostels/a/b.jpg")).rejects.toThrow();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("skips the delete when a listing still uses the same file", async () => {
    mocks.count.mockResolvedValue(1);
    expect(await deleteLegacyPublicVerificationDocument(URL_OK)).toBe(false);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("throws so the caller can retry when storage fails or is not configured", async () => {
    mocks.send.mockRejectedValue(new Error("r2 down"));
    await expect(deleteLegacyPublicVerificationDocument(URL_OK)).rejects.toThrow("r2 down");

    vi.stubEnv("R2_BUCKET_NAME", "");
    await expect(deleteLegacyPublicVerificationDocument(URL_OK)).rejects.toThrow(/not configured/);
  });
});
