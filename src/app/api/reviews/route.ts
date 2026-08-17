// Path: src/app/api/reviews/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { reviewSchema } from "@hostello/shared";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { indexSingleHostel } from "@/lib/typesense-sync";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const hostelId = url.searchParams.get("hostelId");
    if (!hostelId) return NextResponse.json({ error: "hostelId is required." }, { status: 400 });

    const reviews = await db.review.findMany({
      where: { hostelId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({ data: reviews });
  } catch (err) {
    console.error("[GET /api/reviews]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const hostelId = typeof body?.hostelId === "string" ? body.hostelId : "";
    const parsed = reviewSchema.safeParse(body);

    if (!hostelId || !parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.success ? undefined : parsed.error.flatten() },
        { status: 400 },
      );
    }

    const completedBooking = await db.booking.findFirst({
      where: {
        userId: session.user.id,
        hostelId,
        status: "COMPLETED",
      },
      select: { id: true },
    });

    if (!completedBooking) {
      return NextResponse.json(
        { error: "You can only review hostels where you have completed a stay." },
        { status: 403 },
      );
    }

    const review = await db.$transaction(async (tx) => {
      // wouldRecommend isn't in reviewSchema (from @hostello/shared, not
      // present in this snapshot to extend) — read it straight off the raw
      // body instead of parsed.data so it doesn't get silently dropped.
      const wouldRecommend = typeof body?.wouldRecommend === "boolean" ? body.wouldRecommend : undefined;

      const savedReview = await tx.review.upsert({
        where: {
          hostelId_userId: {
            hostelId,
            userId: session.user.id,
          },
        },
        create: {
          ...parsed.data,
          wouldRecommend,
          hostelId,
          userId: session.user.id,
          verified: true,
        },
        update: {
          ...parsed.data,
          wouldRecommend,
          verified: true,
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      });

      const aggregate = await tx.review.aggregate({
        where: { hostelId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const reviewCount =
        typeof aggregate._count === "number"
          ? aggregate._count
          : aggregate._count.rating;

      await tx.hostel.update({
        where: { id: hostelId },
        data: {
          rating: aggregate._avg.rating ?? 0,
          reviewCount,
        },
      });

      return savedReview;
    });

    const hostel = await db.hostel.findUnique({
      where: { id: hostelId },
      select: { id: true, ownerId: true, name: true },
    });

    if (hostel) {
      void createNotification({
        userId: hostel.ownerId,
        type: "REVIEW_RECEIVED",
        title: "New Review",
        message: `${session.user.name ?? "A student"} reviewed ${hostel.name}.`,
        reviewId: review.id,
        hostelId,
      });
      void indexSingleHostel(hostelId).catch((err) => {
        console.warn("[POST /api/reviews] Typesense sync failed:", err);
      });
    }

    return NextResponse.json(
      { data: review, message: "Review submitted." },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/reviews]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
