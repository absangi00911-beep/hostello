import { getSafeErrorSummary } from "@/lib/safe-error";
import { runAfterResponse } from "@/lib/background";
// Path: src/app/api/auth/signup/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { signupSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email-templates/welcome";
import { verificationEmail } from "@/lib/email-templates/verification";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { randomBytes } from "crypto";
import { hashOneTimeToken } from "@/lib/one-time-token";
import { getAppOrigin } from "@/lib/app-url";
import { readBoundedJson } from "@/lib/bounded-json";

export async function POST(req: NextRequest) {
  // 5 signups per IP per hour
  const rl = await rateLimit(`signup:${getIp(req)}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  try {
    const body = await readBoundedJson(req, 8_192);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    const parsed = signupSchema.safeParse(body.data);

    if (!parsed.success) {
      console.error("[signup] Validation failed:", getSafeErrorSummary(parsed.error));
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, phone, role } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashed = await hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashed,
        phone: phone || null,
        role,
        // emailVerified is intentionally null until the user clicks the link
      },
      select: { id: true, name: true, email: true, role: true },
    });

    const origin = getAppOrigin();

    // Store the verification token before responding, so a signup that returns
    // 201 always has a valid token. A failure here never breaks signup; the user
    // can request a new link with /api/auth/resend-verification.
    let verifyUrl: string | null = null;
    try {
      // Delete any lingering tokens for this address
      await db.verificationToken.deleteMany({ where: { identifier: email } });

      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h

      await db.verificationToken.create({
        data: { token: hashOneTimeToken(token), identifier: email, expires },
      });
      verifyUrl = `${origin}/api/auth/verify-email?token=${token}`;
    } catch (err) {
      console.error("[signup] Failed to store verification token:", getSafeErrorSummary(err));
    }

    // The emails are sent after the response so they are not cut off.
    if (verifyUrl) {
      const link = verifyUrl;
      void runAfterResponse("email.verification", () =>
        sendEmail({ to: user.email, ...verificationEmail({ name: user.name, verifyUrl: link }) }),
      );
    }
    const welcomeTemplate = welcomeEmail({ name: user.name, role: user.role as "STUDENT" | "OWNER" });
    void runAfterResponse("email.welcome", () => sendEmail({ to: user.email, ...welcomeTemplate }));

    return NextResponse.json(
      { data: user, message: "Account created successfully." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/auth/signup]", getSafeErrorSummary(err));
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
