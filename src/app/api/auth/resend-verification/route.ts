import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { verificationEmail } from "@/lib/email-templates/verification";
import { randomBytes } from "crypto";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { getRequestOrigin } from "@/lib/app-url";

export async function POST(req: NextRequest) {
  const rl = await rateLimit(`resend-verify:${getIp(req)}`, {
    limit: 3,
    windowMs: 15 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "Email is already verified." });
    }

    // Delete any existing tokens for this email
    await db.verificationToken.deleteMany({
      where: { identifier: user.email },
    });

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.verificationToken.create({
      data: { token, identifier: user.email, expires },
    });

    const origin = getRequestOrigin(req);
    const verifyUrl = `${origin}/api/auth/verify-email?token=${token}`;
    const template = verificationEmail({ name: user.name, verifyUrl });

    await sendEmail({ to: user.email, ...template });

    return NextResponse.json({ message: "Verification email sent. Check your inbox." });
  } catch (err) {
    console.error("[POST /api/auth/resend-verification]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
