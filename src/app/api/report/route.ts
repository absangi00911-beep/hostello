import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getIp, rateLimit } from "@/lib/rate-limit";
import { reportSchema, sendIssueReport } from "@/lib/support";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: "Sign in to submit a report." },
      { status: 401 },
    );
  }

  const rl = await rateLimit(`report:${getIp(req)}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many reports. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const parsed = reportSchema.safeParse(await req.json());
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { error: issue?.message ?? "Invalid report." },
        { status: 400 },
      );
    }

    const result = await sendIssueReport(parsed.data);
    if (!result.success) {
      return NextResponse.json(
        { error: "We couldn't submit your report right now." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      message: "Report submitted. We review all reports within 48 hours.",
    });
  } catch (err) {
    console.error("[POST /api/report]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}