import { getSafeErrorSummary } from "@/lib/safe-error";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readBoundedJson } from "@/lib/bounded-json";
import { getIp, rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { loginOtpEmail } from "@/lib/email-templates/login-otp";
import {
  emailOtpIdentifier,
  generateEmailOtp,
  hashEmailLoginIdentifier,
  hashEmailOtp,
  isValidLoginEmail,
  normalizeLoginEmail,
} from "@/lib/auth/email-otp";

const MAX_BODY_BYTES = 1_024;
const OTP_LIFETIME_MS = 10 * 60 * 1000;
const REQUEST_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const body = await readBoundedJson(req, MAX_BODY_BYTES);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }

    const rawEmail = typeof body.data === "object" && body.data !== null && "email" in body.data
      ? body.data.email
      : null;
    if (typeof rawEmail !== "string" || !isValidLoginEmail(rawEmail.trim())) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const email = normalizeLoginEmail(rawEmail);
    const ipLimit = await rateLimit(`email-otp-request-ip:${getIp(req)}`, {
      limit: 10,
      windowMs: REQUEST_WINDOW_MS,
    });
    const emailLimit = await rateLimit(
      `email-otp-request-account:${hashEmailLoginIdentifier(email)}`,
      { limit: 3, windowMs: REQUEST_WINDOW_MS },
    );
    if (!ipLimit.ok || !emailLimit.ok) {
      return NextResponse.json(
        { error: "Too many code requests. Please try again later." },
        { status: 429 },
      );
    }

    const identifier = emailOtpIdentifier(email);
    const code = generateEmailOtp();
    const codeToken = hashEmailOtp(email, code);
    await db.$transaction(
      async (tx) => {
        await tx.verificationToken.deleteMany({ where: { identifier } });
        await tx.verificationToken.create({
          data: {
            identifier,
            token: codeToken,
            expires: new Date(Date.now() + OTP_LIFETIME_MS),
          },
        });
      },
      { isolationLevel: "Serializable" },
    );

    const delivery = await sendEmail({
      to: email,
      ...loginOtpEmail({ code }),
    });
    if (!delivery.success || delivery.dev) {
      await db.verificationToken.deleteMany({
        where: { identifier, token: codeToken },
      });
      return NextResponse.json(
        { error: "Email delivery is temporarily unavailable. Please try again." },
        { status: 503 },
      );
    }

    return NextResponse.json({
      message: "If this email can receive sign-in codes, a code has been sent.",
    });
  } catch (error) {
    console.error("[POST /api/auth/email-otp]", getSafeErrorSummary(error));
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
