import { getSafeErrorSummary } from "@/lib/safe-error";
// Path: src/app/api/auth/mobile/refresh/route.ts
//
// Accepts a still-valid NextAuth session token from a mobile client and
// returns a new token with the shared mobile session lifetime. Auth.js tokens
// are encrypted JWE values; decode authenticates/decrypts the token and checks
// its expiry, so expired tokens require a fresh sign-in.
//
// This route is automatically CSRF-exempt because the middleware skips CSRF
// checks for any request that carries a Bearer token (see src/proxy.ts).
//
// Rate limit: 10 refresh calls per user per hour. The client refreshes near
// expiry and when returning to the foreground, rather than parsing token bytes.

import { type NextRequest, NextResponse } from "next/server";
import { decode, encode } from "next-auth/jwt";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { MOBILE_SESSION_MAX_AGE_SECONDS } from "@hostello/shared";

const MAX_MOBILE_SESSION_TOKEN_LENGTH = 4_096;
const MAX_USER_ID_LENGTH = 128;

type MobileJwtPayload = {
  id?: unknown;
  tokenVersion?: unknown;
};

export async function POST(req: NextRequest) {
  try {
    // -- 1. Extract bearer token --------------------------------------------
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }
    const rawToken = authHeader.slice(7);
    if (!rawToken || rawToken.length > MAX_MOBILE_SESSION_TOKEN_LENGTH) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      console.error("[mobile-refresh] AUTH_SECRET is not configured");
      return NextResponse.json(
        { error: "Authentication service misconfigured" },
        { status: 500 }
      );
    }

    // The salt must match the session cookie name NextAuth uses.
    const isProd = process.env.NODE_ENV === "production";
    const salt = isProd
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    // -- 2. Authenticate and decrypt the Auth.js JWE -------------------------
    // decode() also enforces the token's expiry. Expired credentials cannot
    // be refreshed and must be replaced by a new sign-in.
    let decoded: Awaited<ReturnType<typeof decode>>;
    try {
      decoded = await decode({ token: rawToken, secret, salt });
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const tokenPayload = decoded as MobileJwtPayload | null;
    if (
      typeof tokenPayload?.id !== "string" ||
      tokenPayload.id.length < 1 ||
      tokenPayload.id.length > MAX_USER_ID_LENGTH ||
      !Number.isSafeInteger(tokenPayload.tokenVersion) ||
      (tokenPayload.tokenVersion as number) < 0
    ) {
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 401 }
      );
    }

    const userId = tokenPayload.id;

    // -- 3. Rate limit per user, not per IP ---------------------------------
    const rl = await rateLimit(`refresh:${userId}`, {
      limit: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
    });
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // -- 4. Validate tokenVersion against the DB ----------------------------
    // This is the revocation check.  If the user reset their password,
    // tokenVersion was incremented in the DB, and the value in the JWT
    // will be stale.  We refuse to issue a new token in that case.
    //
    // We go straight to the DB here (bypassing the Redis cache) so that
    // a revocation triggered by a password reset is honoured immediately
    // without waiting for the 5-minute cache TTL.
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id:            true,
        name:          true,
        email:         true,
        role:          true,
        avatar:        true,
        emailVerified: true,
        tokenVersion:  true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    if (user.tokenVersion !== tokenPayload.tokenVersion) {
      return NextResponse.json(
        { error: "Token has been revoked" },
        { status: 401 }
      );
    }

    // -- 5. Issue a new token with an explicit 30-day expiry ----------------
    // The original mobile login route omits maxAge, which means it inherits
    // NextAuth's session default.  We always set it explicitly here so the
    // refresh behaviour is predictable regardless of server config.
    const newToken = await encode({
      token: {
        id:            user.id,
        name:          user.name,
        email:         user.email,
        picture:       user.avatar,
        role:          user.role,
        emailVerified: !!user.emailVerified,
        tokenVersion:  user.tokenVersion,
      },
      secret,
      salt,
      maxAge: MOBILE_SESSION_MAX_AGE_SECONDS,
    });

    return NextResponse.json(
      { data: { token: newToken, expiresInSeconds: MOBILE_SESSION_MAX_AGE_SECONDS } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[POST /api/auth/mobile/refresh]", getSafeErrorSummary(err));
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
