import { getSafeErrorSummary } from "@/lib/safe-error";
// Path: src/app/api/auth/phone/verify-otp/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { normalizePhoneNumber } from "@/lib/sms";
import { z } from "zod";
import { readBoundedJson } from "@/lib/bounded-json";

const verifyOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^(\+92|0)[0-9]{10}$/, "Invalid Pakistani phone number format"),
  otp: z
    .string()
    .regex(/^\d{6}$/, "OTP must be 6 digits"),
});

/**
 * POST /api/auth/phone/verify-otp
 *
 * Verify a phone number using an OTP.
 * Updates the user's phone and marks it as verified.
 *
 * Request body:
 *   { phone: string, otp: string }
 *
 * Response:
 *   { message: "Phone verified successfully" }
 *
 * Errors:
 *   - 400: Invalid input or OTP incorrect/expired
 *   - 401: Unauthorized (must be logged in)
 *   - 500: Database error
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await readBoundedJson(req, 1_024);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    const parsed = verifyOtpSchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid phone or OTP format" },
        { status: 400 }
      );
    }

    const { phone, otp } = parsed.data;
    const normalized = normalizePhoneNumber(phone);

    if (!normalized) {
      return NextResponse.json(
        { error: "Invalid Pakistani phone number" },
        { status: 400 }
      );
    }

    // Find the OTP token, scoped to the current user
    // This prevents token confusion if multiple users request OTPs for the same phone
    const token = await db.phoneVerificationToken.findFirst({
      where: { phone: normalized, userId: session.user.id },
    });
    const now = new Date();

    if (!token) {
      return NextResponse.json(
        { error: "No OTP found. Request a new one." },
        { status: 400 }
      );
    }

    // Check if expired
    if (now > token.expires) {
      // Clean up expired token
      await db.phoneVerificationToken.deleteMany({
        where: { phone: normalized, otp: token.otp, userId: session.user.id },
      });
      return NextResponse.json(
        { error: "OTP expired. Request a new one." },
        { status: 400 }
      );
    }

    // Check if max attempts exceeded
    if (token.attempts >= 5) {
      await db.phoneVerificationToken.deleteMany({
        where: { phone: normalized, otp: token.otp, userId: session.user.id },
      });
      return NextResponse.json(
        { error: "Too many failed attempts. Request a new OTP." },
        { status: 400 }
      );
    }

    // Verify OTP
    if (token.otp !== otp) {
      // Claim one remaining attempt conditionally so concurrent requests
      // cannot all increment from the same stale attempt count.
      const attempt = await db.phoneVerificationToken.updateMany({
        where: {
          phone: normalized,
          otp: token.otp,
          userId: session.user.id,
          attempts: { lt: 5 },
          expires: { gt: now },
        },
        data: { attempts: { increment: 1 } },
      });

      if (attempt.count !== 1) {
        return NextResponse.json(
          { error: "OTP is no longer valid. Request a new one." },
          { status: 400 },
        );
      }

      const remaining = Math.max(0, 5 - (token.attempts + 1));
      return NextResponse.json(
        {
          error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
        },
        { status: 400 }
      );
    }

    // Claim the OTP once and update the user in one transaction. Concurrent
    // correct-code requests cannot both reuse the verification token.
    const updatedUser = await db.$transaction(async (tx) => {
      const claimed = await tx.phoneVerificationToken.deleteMany({
        where: {
          phone: normalized,
          userId: session.user.id,
          otp,
          attempts: { lt: 5 },
          expires: { gt: new Date() },
        },
      });
      if (claimed.count !== 1) return null;

      return tx.user.update({
        where: { id: session.user.id },
        data: {
          phone: normalized,
          phoneVerified: new Date(),
        },
        select: {
          id: true,
          phone: true,
          phoneVerified: true,
        },
      });
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: "OTP expired or already used. Request a new one." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: "Phone verified successfully",
        data: updatedUser,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST /api/auth/phone/verify-otp]", getSafeErrorSummary(err));
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
