import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000;

export type EmailUnsubscribeClaims = {
  userId: string;
  email: string;
  expiresAt: number;
};

/** Create a signed bearer token for an email preference link. */
export function createEmailUnsubscribeToken(
  userId: string,
  email: string,
  secret: string,
  now = Date.now(),
): string {
  if (!userId || userId.length > 128 || !email || email.length > 254 || !secret) {
    throw new Error("Invalid email unsubscribe token input.");
  }

  const payload = Buffer.from(JSON.stringify({
    version: 1,
    userId,
    email,
    expiresAt: now + TOKEN_LIFETIME_MS,
  })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

/** Verify signature and expiry before a token is allowed to change preferences. */
export function verifyEmailUnsubscribeToken(
  token: string,
  secret: string,
  now = Date.now(),
): EmailUnsubscribeClaims | null {
  if (!secret || token.length > 2_048) return null;

  const [payload, encodedSignature, ...extra] = token.split(".");
  if (
    extra.length > 0 ||
    !payload ||
    !encodedSignature ||
    !/^[A-Za-z0-9_-]+$/.test(payload) ||
    !/^[A-Za-z0-9_-]+$/.test(encodedSignature)
  ) {
    return null;
  }

  const signature = Buffer.from(encodedSignature, "base64url");
  const expected = createHmac("sha256", secret).update(payload).digest();
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
    if (
      claims.version !== 1 ||
      typeof claims.userId !== "string" || claims.userId.length < 1 || claims.userId.length > 128 ||
      typeof claims.email !== "string" || claims.email.length < 3 || claims.email.length > 254 || !claims.email.includes("@") ||
      typeof claims.expiresAt !== "number" || !Number.isSafeInteger(claims.expiresAt) || claims.expiresAt <= now
    ) {
      return null;
    }

    return {
      userId: claims.userId,
      email: claims.email,
      expiresAt: claims.expiresAt,
    };
  } catch {
    return null;
  }
}
