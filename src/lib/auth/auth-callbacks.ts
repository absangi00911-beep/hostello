import type { NextAuthConfig } from "next-auth";

type JwtCallback = NonNullable<NonNullable<NextAuthConfig["callbacks"]>["jwt"]>;
type ValidateTokenVersion = (userId: string, claimed: number) => Promise<boolean>;

const VALID_ROLES = new Set(["STUDENT", "OWNER", "ADMIN"]);

/** Build a JWT callback that drops revoked or malformed sessions completely. */
export function createJwtCallback(
  validateTokenVersion: ValidateTokenVersion,
): JwtCallback {
  return async ({ token, user }) => {
    if (user) {
      token.id = user.id;
      token.role = user.role;
      token.emailVerified = user.emailVerified ?? null;
      token.tokenVersion = user.tokenVersion ?? 0;
      return token;
    }

    const userId: unknown = token.id;
    const tokenVersion: unknown = token.tokenVersion;
    const role: unknown = token.role;

    if (
      typeof userId !== "string" ||
      userId.length === 0 ||
      typeof tokenVersion !== "number" ||
      !Number.isInteger(tokenVersion) ||
      !VALID_ROLES.has(String(role))
    ) {
      return null;
    }

    // Auth.js clears the session cookie when this callback returns null.
    // Returning a session with an empty ID is insufficient: role-only route
    // guards could otherwise keep trusting a stale ADMIN claim.
    return (await validateTokenVersion(userId, tokenVersion)) ? token : null;
  };
}
