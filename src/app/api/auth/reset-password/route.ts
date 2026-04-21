import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { z } from "zod";
import { invalidateLocalSessionCache } from "@/lib/auth/config";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid request." },
        { status: 400 },
      );
    }

    const { token, password } = parsed.data;

    const record = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: { select: { id: true } } },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Invalid or expired link." },
        { status: 400 },
      );
    }
    if (record.usedAt) {
      return NextResponse.json(
        { error: "This link has already been used." },
        { status: 400 },
      );
    }
    if (record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This link has expired. Request a new one." },
        { status: 400 },
      );
    }

    const hashed = await hash(password, 12);

    await db.$transaction([
      db.user.update({
        where: { id: record.userId },
        data: {
          password: hashed,
          // Increment tokenVersion so every outstanding JWT issued with the
          // previous version fails the session callback's version check.
          // This is the primary mechanism for invalidating active sessions
          // after a credential change.
          tokenVersion: { increment: 1 },
        },
      }),
      db.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Clear in-process token-version cache for this instance so the revocation
    // takes effect immediately without waiting for the 30-second TTL to drain.
    invalidateLocalSessionCache(record.userId);

    return NextResponse.json({
      message: "Password updated. You can now sign in.",
    });
  } catch (err) {
    console.error("[POST /api/auth/reset-password]", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}