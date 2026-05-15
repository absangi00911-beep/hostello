// Path: src/app/api/auth/mobile/login/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { encode } from "next-auth/jwt";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
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
