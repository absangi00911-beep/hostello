// Path: src/app/api/auth/phone/request-otp/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { generateOTP, sendOtpSms, normalizePhoneNumber } from "@/lib/sms";
import { z } from "zod";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { readBoundedJson } from "@/lib/bounded-json";

const requestOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^(\+92|0)[0-9]{10}$/, "Invalid Pakistani phone number format"),
});

/**
 * POST /api/auth/phone/request-otp
 *
 * Request an OTP to verify a phone number.
 * The OTP is sent via SMS and valid for 10 minutes.
 *
 * Request body:
 *   { phone: string }  // Format: 0300-1234567 or +923001234567
 *
 * Response:
 *   { message: "OTP sent to your phone" }
 *
 * Errors:
 *   - 400: Invalid phone number
 *   - 429: Too many requests (5 per phone per day)
 *   - 500: Failed to send SMS
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sign in to verify a phone number." }, { status: 401 });
    }
    
    const body = await readBoundedJson(req, 1_024);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    const parsed = requestOtpSchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    const { phone } = parsed.data;
    const normalized = normalizePhoneNumber(phone);

    if (!normalized) {
      return NextResponse.json(
        { error: "Invalid Pakistani phone number" },
        { status: 400 }
      );
    }

    // Bound paid SMS traffic by both destination and trusted client IP.
    const ipLimit = await rateLimit(`otp-ip:${getIp(req)}`, {
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    if (!ipLimit.ok) {
      return NextResponse.json(
        { error: "Too many OTP requests. Try again later." },
        { status: 429 },
      );
    }

    // Rate limit: 5 OTP requests per phone per day
    const rl = await rateLimit(`otp:${normalized}`, {
      limit: 5,
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
    });

    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many OTP requests. Try again later." },
        { status: 429 }
      );
    }

    // Delete any existing OTP for this phone and user
    await db.phoneVerificationToken.deleteMany({
      where: { phone: normalized, userId: session.user.id },
    });

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database, associated with the current user if authenticated
    await db.phoneVerificationToken.create({
      data: {
        phone: normalized,
        otp,
        expires: expiresAt,
        userId: session.user.id,
      },
    });

    // Send OTP via SMS
    const smsResult = await sendOtpSms(normalized, otp);

    if (!smsResult.success && !smsResult.dev) {
      console.error("[phone/request-otp] SMS provider reported failure");
      return NextResponse.json(
        { error: "Failed to send OTP. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "OTP sent to your phone",
        ...(smsResult.dev && { dev: true, note: "SMS not sent (development mode)" }),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST /api/auth/phone/request-otp]", getSafeErrorSummary(err));
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
