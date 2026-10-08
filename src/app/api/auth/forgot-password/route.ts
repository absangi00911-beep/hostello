import { getSafeErrorSummary } from "@/lib/safe-error";
// Path: src/app/api/auth/forgot-password/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email-templates/password-reset";
import { randomBytes } from "crypto";
import { hashPasswordResetToken } from "@/lib/password-reset-token";
import { z } from "zod";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { getAppOrigin } from "@/lib/app-url";
import { readBoundedJson } from "@/lib/bounded-json";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  // 3 reset requests per IP per 15 minutes
  const rl = await rateLimit(`reset:${getIp(req)}`, { limit: 3, windowMs: 15 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  try {
    const body = await readBoundedJson(req, 1_024);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    const parsed = schema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    }

    const { email } = parsed.data;
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    // Always return success — never reveal whether an email exists
    if (!user) {
      return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
    }

    // Limit token invalidation and mailbox flooding even when requests come
    // from many IP addresses. Keep the response identical to the unknown-user
    // case so this account-specific limit does not reveal account existence.
    const accountRl = await rateLimit(`reset-account:${user.id}`, {
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (!accountRl.ok) {
      return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
    }

    // Invalidate any previous tokens for this user
    const token     = randomBytes(32).toString("hex");
    const tokenHash = hashPasswordResetToken(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    // Use a transaction to ensure atomicity: invalidate old tokens and create new one
    // in a single atomic operation. This prevents race conditions where two simultaneous
    // requests could both pass the invalidation check and both create valid tokens.
    await db.$transaction([
      db.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data:  { usedAt: new Date() },
      }),
      db.passwordResetToken.create({
        data: { token: tokenHash, userId: user.id, expiresAt },
      }),
    ]);

    const resetUrl = `${getAppOrigin()}/reset-password?token=${token}`;
    const template = passwordResetEmail({ name: user.name, resetUrl });

    try {
      await sendEmail({ to: user.email, ...template });
    } catch (err) {
      console.error("[forgot-password] Failed to send reset email:", getSafeErrorSummary(err));
    }

    return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    console.error("[POST /api/auth/forgot-password]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
