import { type NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { signupSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email-templates/welcome";
import { verificationEmail } from "@/lib/email-templates/verification";
import { rateLimit, getIp } from "@/lib/rate-limit";
import { randomBytes } from "crypto";
import { getRequestOrigin } from "@/lib/app-url";

export async function POST(req: NextRequest) {
  // 5 signups per IP per hour
  const rl = await rateLimit(`signup:${getIp(req)}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      console.error("[signup] Validation errors:", parsed.error.flatten());
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

    const origin = getRequestOrigin(req);

    // Generate and store a verification token, then send the email.
    // Both are fire-and-forget — a failure never breaks signup.
    void (async () => {
      try {
        // Delete any lingering tokens for this address
        await db.verificationToken.deleteMany({ where: { identifier: email } });

        const token = randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h

        await db.verificationToken.create({
          data: { token, identifier: email, expires },
        });

        const verifyUrl = `${origin}/api/auth/verify-email?token=${token}`;
        const verifyTemplate = verificationEmail({ name: user.name, verifyUrl });
        await sendEmail({ to: user.email, ...verifyTemplate });
      } catch (err) {
        console.error("[signup] Failed to send verification email:", err);
      }
    })();

    // Welcome email (separate, fire-and-forget)
    const welcomeTemplate = welcomeEmail({ name: user.name, role: user.role as "STUDENT" | "OWNER" });
    sendEmail({ to: user.email, ...welcomeTemplate }).catch(() => {});

    return NextResponse.json(
      { data: user, message: "Account created successfully." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/auth/signup]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
