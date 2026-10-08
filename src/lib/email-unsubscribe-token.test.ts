import { describe, expect, it } from "vitest";
import {
  createEmailUnsubscribeToken,
  verifyEmailUnsubscribeToken,
} from "@/lib/email-unsubscribe-token";

const SECRET = "test-only-secret-that-is-long-enough";
const NOW = 1_800_000_000_000;

describe("email unsubscribe tokens", () => {
  it("signs claims and verifies them before expiry", () => {
    const token = createEmailUnsubscribeToken("usr_1", "student@example.com", SECRET, NOW);

    expect(verifyEmailUnsubscribeToken(token, SECRET, NOW)).toEqual({
      userId: "usr_1",
      email: "student@example.com",
      expiresAt: NOW + 180 * 24 * 60 * 60 * 1000,
    });
  });

  it("rejects tokens with a changed signature or an incorrect secret", () => {
    const token = createEmailUnsubscribeToken("usr_1", "student@example.com", SECRET, NOW);
    const [payload, signature] = token.split(".");

    expect(verifyEmailUnsubscribeToken(`${payload}.${signature}x`, SECRET, NOW)).toBeNull();
    expect(verifyEmailUnsubscribeToken(token, "another-secret", NOW)).toBeNull();
  });

  it("rejects expired and unsigned legacy payloads", () => {
    const token = createEmailUnsubscribeToken("usr_1", "student@example.com", SECRET, NOW);
    const legacy = Buffer.from("usr_1:student@example.com").toString("base64url");

    expect(verifyEmailUnsubscribeToken(token, SECRET, NOW + 180 * 24 * 60 * 60 * 1000)).toBeNull();
    expect(verifyEmailUnsubscribeToken(legacy, SECRET, NOW)).toBeNull();
  });
});
