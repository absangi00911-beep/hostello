import { getSafeErrorSummary } from "@/lib/safe-error";
import { randomBytes } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readBoundedJson } from "@/lib/bounded-json";
import { getIp, rateLimit } from "@/lib/rate-limit";
import { hashOneTimeToken } from "@/lib/one-time-token";
import {
  emailLoginGrantIdentifier,
  emailOtpIdentifier,
  hashEmailLoginIdentifier,
  hashEmailOtp,
  isValidLoginEmail,
  normalizeLoginEmail,
} from "@/lib/auth/email-otp";

const MAX_BODY_BYTES = 1_024;
const GRANT_LIFETIME_MS = 5 * 60 * 1000;
const VERIFY_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const body = await readBoundedJson(req, MAX_BODY_BYTES);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }

    const data = body.data;
    const emailInput =
      typeof data === "object" && data !== null && "email" in data
        ? data.email
        : null;
    const code =
      typeof data === "object" && data !== null && "code" in data
        ? data.code
        : null;
    if (
      typeof emailInput !== "string" ||
      !isValidLoginEmail(emailInput.trim()) ||
      typeof code !== "string" ||
      !/^\d{6}$/.test(code)
    ) {
      return NextResponse.json(
        { error: "Enter a valid email address and 6-digit code." },
        { status: 400 },
      );
    }

    const email = normalizeLoginEmail(emailInput);
    const ipLimit = await rateLimit(`email-otp-verify-ip:${getIp(req)}`, {
      limit: 10,
      windowMs: VERIFY_WINDOW_MS,
    });
    const emailLimit = await rateLimit(
      `email-otp-verify-account:${hashEmailLoginIdentifier(email)}`,
      { limit: 5, windowMs: VERIFY_WINDOW_MS },
    );
    if (!ipLimit.ok || !emailLimit.ok) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please try again later." },
        { status: 429 },
      );
    }

    const grant = randomBytes(32).toString("hex");
    const now = new Date();
    const result = await db.$transaction(async (tx) => {
      const claimed = await tx.verificationToken.deleteMany({
        where: {
          identifier: emailOtpIdentifier(email),
          token: hashEmailOtp(email, code),
          expires: { gt: now },
        },
      });
      if (claimed.count !== 1) return null;

      const existingUser = await tx.user.findUnique({
        where: { email },
        select: { id: true },
      });
      await tx.verificationToken.create({
        data: {
          identifier: emailLoginGrantIdentifier(email),
          token: hashOneTimeToken(grant),
          expires: new Date(now.getTime() + GRANT_LIFETIME_MS),
        },
      });
      return { needsName: !existingUser };
    });

    if (!result) {
      return NextResponse.json(
        { error: "That code is invalid or has expired. Request a new one." },
        { status: 400 },
      );
    }

    return NextResponse.json({ grant, needsName: result.needsName });
  } catch (error) {
    console.error("[POST /api/auth/email-otp/verify]", getSafeErrorSummary(error));
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
