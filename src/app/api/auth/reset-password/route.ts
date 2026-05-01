import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { z } from "zod";
import { invalidateLocalSessionCache } from "@/lib/auth/config";

// ─── Session Invalidation Pattern ──────────────────────────────────────────
// When a user's password changes (either via reset-password or change-password),
// all existing sessions must be revoked immediately to prevent account takeover.
//
// MECHANISM:
// 1. Increment user.tokenVersion in database
// 2. Clear in-process cache via invalidateLocalSessionCache(userId)
// 3. On next request, auth() calls validateTokenVersion() which fails if
//    token's embedded tokenVersion no longer matches DB version
// 4. Session callback throws, auth() returns null, user is signed out
//
// WHY TWO FLOWS?
// - reset-password: Unauthenticated, user has forgotten password
//   - Requires valid reset token (token is single-use for security)
//   - Must mark token as usedAt to prevent replay attacks
//   - See: /src/app/api/profile/change-password for authenticated flow
//
// - change-password: Authenticated, user actively changing password
//   - Requires verification of current password
//   - No token to mark (user already has session)
//   - See: /src/app/api/auth/reset-password for unauthenticated flow
//
// BOTH achieve identical security: active sessions are revoked, forcing
// re-authentication with new credentials.
// ────────────────────────────────────────────────────────────────────────────

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
          // Increment tokenVersion to revoke all existing sessions.
          // See comment block above for mechanism and why this is needed.
          tokenVersion: { increment: 1 },
        },
      }),
      db.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Clear in-process token-version cache for immediate effect on this instance.
    // Other instances will detect revocation on their next session check.
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