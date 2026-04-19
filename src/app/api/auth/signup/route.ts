import { type NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { signupSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email-templates/welcome";
import { rateLimit, getIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // 5 signups per IP per hour
  const rl = rateLimit(`signup:${getIp(req)}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
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
      },
      select: { id: true, name: true, email: true, role: true },
    });

    // Send welcome email — fire and forget.
    // If Resend is down, signup still works.
    const template = welcomeEmail({ name: user.name, role: user.role as "STUDENT" | "OWNER" });
    void sendEmail({ to: user.email, ...template });

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
