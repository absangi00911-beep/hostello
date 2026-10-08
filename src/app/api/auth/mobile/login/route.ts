import { getSafeErrorSummary } from "@/lib/safe-error";
// Path: src/app/api/auth/mobile/login/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { readBoundedJson } from "@/lib/bounded-json";
import {
  authorizeCredentials,
  checkCredentialLoginIpLimit,
  CredentialLoginRateLimitError,
  credentialLoginSchema,
} from "@/lib/auth/credentials-authorize";
import { MOBILE_SESSION_MAX_AGE_SECONDS } from "@hostello/shared";

export async function POST(req: NextRequest) {
  // Share the web sign-in IP budget so alternating clients cannot double it.
  if (!(await checkCredentialLoginIpLimit(req))) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const body = await readBoundedJson(req, 4_096);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    const parsed = credentialLoginSchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const user = await authorizeCredentials(parsed.data, req, { ipLimitAlreadyChecked: true });
    if (!user) {
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
        picture: user.image,
        role: user.role,
        emailVerified: !!user.emailVerified,
        tokenVersion: user.tokenVersion,
      },
      secret,
      salt,
      maxAge: MOBILE_SESSION_MAX_AGE_SECONDS,
    });

    return NextResponse.json({
      data: {
        token,
        expiresInSeconds: MOBILE_SESSION_MAX_AGE_SECONDS,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.image,
          emailVerified: !!user.emailVerified,
        },
      },
      message: "Login successful",
    });
  } catch (err) {
    if (err instanceof CredentialLoginRateLimitError) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 },
      );
    }
    console.error("[POST /api/auth/mobile/login]", getSafeErrorSummary(err));
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
