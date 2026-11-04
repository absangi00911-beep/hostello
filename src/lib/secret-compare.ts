// Path: src/lib/secret-compare.ts
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Constant-time comparison of a caller-supplied secret with the configured one.
 *
 * `timingSafeEqual` throws a RangeError when its inputs differ in length, so
 * both values are hashed to fixed-length SHA-256 digests first. That keeps the
 * comparison length-safe: it never throws on a length mismatch and does not
 * reveal the secret's length through timing.
 *
 * Returns false when either value is not a string or the expected secret is
 * unset or empty, so a missing configuration can never authenticate a request.
 */
export function safeSecretEqual(provided: unknown, expected: string | null | undefined): boolean {
  if (typeof provided !== "string" || typeof expected !== "string" || expected.length === 0) {
    return false;
  }
  const providedDigest = createHash("sha256").update(provided, "utf8").digest();
  const expectedDigest = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(providedDigest, expectedDigest);
}
