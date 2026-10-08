import { getSafeErrorSummary } from "@/lib/safe-error";
// Path: src/app/api/auth/reset-password/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { hashPasswordResetToken } from "@/lib/password-reset-token";
import { z } from "zod";
import { invalidateLocalSessionCache } from "@/lib/auth/config";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { readBoundedJson } from "@/lib/bounded-json";
import { newPasswordSchema } from "@/lib/validations";

// --- Session Invalidation Pattern ------------------------------------------
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
// ----------------------------------------------------------------------------

const schema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i, "Invalid or expired link."),
  password: newPasswordSchema,
});

export async function POST(req: NextRequest) {
  // 5 attempts per IP per 15 minutes. The reset token is already single-use,
  // but rate-limiting prevents token-flooding DoS and limits brute-forcing of
  // short tokens from compromised reset links.
  const rl = await rateLimit(`reset-password:${getIp(req)}`, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const body = await readBoundedJson(req, 2_048);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    const parsed = schema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 },
      );
    }

    const { token, password } = parsed.data;

    const tokenHash = hashPasswordResetToken(token);
    // Accept outstanding links created before token hashing was introduced.
    // New reset requests persist only the SHA-256 digest.
    const record = await db.passwordResetToken.findFirst({
      where: { OR: [{ token: tokenHash }, { token }] },
      include: { user: { select: { id: true } } },
    });

    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired link." },
        { status: 400 },
      );
    }

    const hashed = await hash(password, 12);

    const usedAt = new Date();
    const updated = await db.$transaction(async (tx) => {
      // Claim the token and change the password in one transaction. The
      // conditional write allows only one concurrent request to win.
      const claim = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null, expiresAt: { gt: usedAt } },
        data: { usedAt },
      });
      if (claim.count !== 1) return false;

      await tx.user.update({
        where: { id: record.userId },
        data: {
          password: hashed,
          // Increment tokenVersion to revoke all existing sessions.
          // See comment block above for mechanism and why this is needed.
          tokenVersion: { increment: 1 },
        },
      });
      return true;
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Invalid or expired link." },
        { status: 400 },
      );
    }

    // Clear in-process token-version cache for immediate effect on this instance.
    // Other instances will detect revocation on their next session check via Redis.
    //
    // MUST be awaited — without await, the Redis DEL completes asynchronously
    // after this function returns. In the gap between the response being sent
    // and the DEL completing, a concurrent request on the same instance could
    // still validate the old tokenVersion from the in-process cache and accept
    // a JWT that should already be invalid.
    await invalidateLocalSessionCache(record.userId);

    return NextResponse.json({
      message: "Password updated. You can now sign in.",
    });
  } catch (err) {
    console.error("[POST /api/auth/reset-password]", getSafeErrorSummary(err));
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 },
    );
  }
}
