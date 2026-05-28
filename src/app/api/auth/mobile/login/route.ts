// Path: src/app/api/auth/mobile/login/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { encode } from "next-auth/jwt";
import { z } from "zod";
import { rateLimit, getIp } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// JWT lifetime must match the refresh route's MAX_AGE_SECONDS so the two flows
// are consistent. Without an explicit maxAge the token would inherit NextAuth's
// session default, which may differ from the 30-day window the refresh endpoint
// always issues — leading to confusing early-expiry UX on first login.
const TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export async function POST(req: NextRequest) {
  // 10 attempts per IP per 15 minutes — prevents password brute-forcing.
  // Keyed on IP rather than email to stop enumeration via timing on per-email keys.
  const rl = await rateLimit(`mobile-login:${getIp(req)}`, {
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      // Don't reveal if the user exists or not for security
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValid = await compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      console.error("[mobile-login] AUTH_SECRET is not configured");
      return NextResponse.json(
        { error: "Authentication service misconfigured" },
        { status: 500 }
      );
    }

    // Generate a JWT compatible with NextAuth v5
    // The salt must match the session cookie name used by NextAuth
    const isProd = process.env.NODE_ENV === "production";
    const salt = isProd ? "__Secure-authjs.session-token" : "authjs.session-token";

    const token = await encode({
      token: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.avatar,
        role: user.role,
        emailVerified: !!user.emailVerified,
        tokenVersion: user.tokenVersion,
      },
      secret,
      salt,
      maxAge: TOKEN_MAX_AGE_SECONDS,
    });

    return NextResponse.json({
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          emailVerified: !!user.emailVerified,
        },
      },
      message: "Login successful",
    });
  } catch (err) {
    console.error("[POST /api/auth/mobile/login]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
