import { getSafeErrorSummary } from "@/lib/safe-error";
// Path: src/app/api/reviews/[id]/reply/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { readBoundedJson } from "@/lib/bounded-json";
import { isBoundedRouteParam } from "@/lib/route-params";

const REVIEW_REPLY_ACTIONS_PER_HOUR = 10;

const replySchema = z.object({
  ownerReply: z.string().min(10, "Reply must be at least 10 characters").max(1000),
});

/**
 * PATCH /api/reviews/[id]/reply
 * Allows a hostel owner to add or update their reply to a review.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const limit = await rateLimit(`review-reply:${session.user.id}`, {
      limit: REVIEW_REPLY_ACTIONS_PER_HOUR,
      windowMs: 60 * 60 * 1000,
    });
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many review reply changes. Try again later." }, { status: 429 });
    }

    const { id } = await params;
    if (!isBoundedRouteParam(id)) {
      return NextResponse.json({ error: "Invalid review." }, { status: 400 });
    }

    const isAdmin = session.user.role === "ADMIN";
    const review = await db.review.findFirst({
      where: isAdmin
        ? { id }
        : { id, hostel: { is: { ownerId: session.user.id } } },
      select: { id: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    const body = await readBoundedJson(req, 2_048);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    const parsed = replySchema.safeParse(body.data);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid reply." },
        { status: 400 }
      );
    }

    const repliedAt = new Date();
    const updateResult = await db.review.updateMany({
      where: isAdmin
        ? { id }
        : { id, hostel: { is: { ownerId: session.user.id } } },
      data: {
        ownerReply: parsed.data.ownerReply,
        repliedAt,
      },
    });

    if (updateResult.count !== 1) {
      return NextResponse.json(
        { error: "Review ownership changed. Refresh and try again." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      data: { id, ownerReply: parsed.data.ownerReply, repliedAt },
      message: "Reply saved.",
    });
  } catch (err) {
    console.error("[PATCH /api/reviews/[id]/reply]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

/**
 * DELETE /api/reviews/[id]/reply
 * Allows a hostel owner to remove their reply.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const limit = await rateLimit(`review-reply:${session.user.id}`, {
      limit: REVIEW_REPLY_ACTIONS_PER_HOUR,
      windowMs: 60 * 60 * 1000,
    });
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many review reply changes. Try again later." }, { status: 429 });
    }

    const { id } = await params;
    if (!isBoundedRouteParam(id)) {
      return NextResponse.json({ error: "Invalid review." }, { status: 400 });
    }

    const isAdmin = session.user.role === "ADMIN";
    const review = await db.review.findFirst({
      where: isAdmin
        ? { id }
        : { id, hostel: { is: { ownerId: session.user.id } } },
      select: { id: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    const updateResult = await db.review.updateMany({
      where: isAdmin
        ? { id }
        : { id, hostel: { is: { ownerId: session.user.id } } },
      data: { ownerReply: null, repliedAt: null },
    });

    if (updateResult.count !== 1) {
      return NextResponse.json(
        { error: "Review ownership changed. Refresh and try again." },
        { status: 409 },
      );
    }

    return NextResponse.json({ message: "Reply removed." });
  } catch (err) {
    console.error("[DELETE /api/reviews/[id]/reply]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
