import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { invalidateLocalSessionCache } from "@/lib/auth/config";

// ─── Session Invalidation Pattern ──────────────────────────────────────────
// When a user's password changes (either via change-password or reset-password),
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
// - change-password: Authenticated, user actively changing password
//   - Requires verification of current password
//   - No token to mark (user already has session)
//   - See: /src/app/api/auth/reset-password for unauthenticated flow
//
// - reset-password: Unauthenticated, user has forgotten password
//   - Requires valid reset token (token is single-use for security)
//   - Must mark token as usedAt to prevent replay attacks
//   - See: /src/app/api/auth/reset-password for details
//
// BOTH achieve identical security: active sessions are revoked, forcing
// re-authentication with new credentials.
// ────────────────────────────────────────────────────────────────────────────

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    // Fetch user with password hash
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    });

    if (!user?.password) {
      return NextResponse.json(
        { error: "Unable to change password for this account" },
        { status: 400 }
      );
    }

    // Verify current password
    const passwordValid = await compare(currentPassword, user.password);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12);

    // Update password and increment tokenVersion to revoke all sessions.
    // See comment block at top of file for mechanism and why this is needed.
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        tokenVersion: { increment: 1 },
      },
    });

    // Clear in-process token-version cache for immediate effect on this instance.
    // Other instances will detect revocation on their next session check.
    await invalidateLocalSessionCache(user.id);

    return NextResponse.json({
      message: "Password changed successfully. Please sign in again.",
    });
  } catch (err) {
    console.error("[POST /api/profile/change-password]", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
