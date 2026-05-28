// Path: src/app/api/auth/mobile/refresh/route.ts
//
// Accepts a still-valid (or recently-expired) NextAuth JWT from a mobile
// client and returns a new token with a fresh 30-day expiry.
//
// This route is automatically CSRF-exempt because the middleware skips CSRF
// checks for any request that carries a Bearer token (see src/proxy.ts).
//
// Rate limit: 10 refresh calls per user per hour.  That's generous enough
// for normal use (proactive refreshes happen at most once per session load)
// and tight enough to prevent token-farming abuse.

import { type NextRequest, NextResponse } from "next/server";
import { decode, encode } from "next-auth/jwt";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

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

    // -- 2. Decode and verify the token signature ---------------------------
    // decode() from next-auth/jwt verifies the HMAC signature.
    // An expired token still decodes successfully — expiry is a soft check
    // so we can issue a replacement even if it lapsed recently.
    let decoded: Awaited<ReturnType<typeof decode>>;
    try {
      decoded = await decode({ token: rawToken, secret, salt });
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const tokenPayload = decoded as MobileJwtPayload | null;
    if (!tokenPayload?.id || typeof tokenPayload.tokenVersion !== "number") {
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 401 }
      );
    }

    const userId = tokenPayload.id as string;

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
      maxAge: MAX_AGE_SECONDS,
    });

    return NextResponse.json({ data: { token: newToken } });
  } catch (err) {
    console.error("[POST /api/auth/mobile/refresh]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
