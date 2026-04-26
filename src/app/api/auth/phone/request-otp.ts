import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { generateOTP, sendOtpSms, normalizePhoneNumber } from "@/lib/sms";
import { z } from "zod";

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
    const body = await req.json();
    const parsed = requestOtpSchema.safeParse(body);

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

    // Delete any existing OTP for this phone
    await db.phoneVerificationToken.deleteMany({
      where: { phone: normalized },
    });

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    await db.phoneVerificationToken.create({
      data: {
        phone: normalized,
        otp,
        expires: expiresAt,
      },
    });

    // Send OTP via SMS
    const smsResult = await sendOtpSms(normalized, otp);

    if (!smsResult.success && !smsResult.dev) {
      console.error("[phone/request-otp] Failed to send SMS:", smsResult.error);
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
    console.error("[POST /api/auth/phone/request-otp]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
