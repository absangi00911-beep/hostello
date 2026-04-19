import { type NextRequest, NextResponse } from "next/server";

import { getIp, rateLimit } from "@/lib/rate-limit";
import { contactSchema, sendContactMessage } from "@/lib/support";

export async function POST(req: NextRequest) {
  const rl = await rateLimit(`contact:${getIp(req)}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many messages. Please try again shortly." }, { status: 429 });
  }

  try {
    const parsed = contactSchema.safeParse(await req.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json({ error: issue?.message ?? "Invalid contact form." }, { status: 400 });
    }

    const result = await sendContactMessage(parsed.data);
    if (!result.success) {
      return NextResponse.json({ error: "We couldn't send your message right now." }, { status: 502 });
    }

    return NextResponse.json({ message: "Message sent! We'll reply within 24 hours." });
  } catch (err) {
    console.error("[POST /api/contact]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
