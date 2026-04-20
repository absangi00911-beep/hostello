import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

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

    const { id } = await params;

    const review = await db.review.findUnique({
      where: { id },
      include: {
        hostel: { select: { ownerId: true } },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    const isOwner = review.hostel.ownerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Only the hostel owner can reply to reviews." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = replySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid reply." },
        { status: 400 }
      );
    }

    const updated = await db.review.update({
      where: { id },
      data: {
        ownerReply: parsed.data.ownerReply,
        repliedAt: new Date(),
      },
      select: {
        id: true,
        ownerReply: true,
        repliedAt: true,
      },
    });

    return NextResponse.json({ data: updated, message: "Reply saved." });
  } catch (err) {
    console.error("[PATCH /api/reviews/[id]/reply]", err);
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

    const { id } = await params;

    const review = await db.review.findUnique({
      where: { id },
      include: {
        hostel: { select: { ownerId: true } },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    const isOwner = review.hostel.ownerId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Only the hostel owner can remove a reply." },
        { status: 403 }
      );
    }

    await db.review.update({
      where: { id },
      data: { ownerReply: null, repliedAt: null },
    });

    return NextResponse.json({ message: "Reply removed." });
  } catch (err) {
    console.error("[DELETE /api/reviews/[id]/reply]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}