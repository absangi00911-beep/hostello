import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { readBoundedJson } from "@/lib/bounded-json";
import { rateLimit } from "@/lib/rate-limit";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { isBoundedRouteParam } from "@/lib/route-params";

type Ctx = { params: Promise<{ id: string }> };

const MAX_BODY_BYTES = 2_048;
const MAX_REASON_LENGTH = 500;

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Only students can report roommate posts" }, { status: 403 });
    }

    const limit = await rateLimit(`roommate-report:${session.user.id}`, {
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many reports. Please try again later." }, { status: 429 });
    }

    const parsed = await readBoundedJson(req, MAX_BODY_BYTES);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }
    if (!parsed.data || typeof parsed.data !== "object" || Array.isArray(parsed.data)) {
      return NextResponse.json({ error: "A report reason is required." }, { status: 400 });
    }

    const inputReason = (parsed.data as Record<string, unknown>).reason;
    if (typeof inputReason !== "string") {
      return NextResponse.json({ error: "A report reason is required." }, { status: 400 });
    }
    const reason = inputReason.trim();
    if (reason.length < 3 || reason.length > MAX_REASON_LENGTH) {
      return NextResponse.json(
        { error: `Report reason must be between 3 and ${MAX_REASON_LENGTH} characters.` },
        { status: 400 },
      );
    }

    const { id: postId } = await params;
    if (!isBoundedRouteParam(postId)) {
      return NextResponse.json({ error: "Invalid post." }, { status: 400 });
    }
    const post = await db.roommatePost.findUnique({
      where: { id: postId },
      select: { userId: true },
    });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (post.userId === session.user.id) {
      return NextResponse.json({ error: "Cannot report your own post" }, { status: 400 });
    }

    await db.roommateReport.upsert({
      where: { postId_reporterId: { postId, reporterId: session.user.id } },
      create: { postId, reporterId: session.user.id, reason },
      update: { reason },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[POST /api/roommates/[id]/report]", getSafeErrorSummary(error));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
