import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { reviewSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Sign in to leave a review." }, { status: 401 });
    }

    const body = await req.json();
    const hostelId = body.hostelId as string | undefined;

    if (!hostelId) {
      return NextResponse.json({ error: "hostelId is required." }, { status: 400 });
    }

    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check user had a completed booking at this hostel
    const hasStayed = await db.booking.findFirst({
      where: {
        hostelId,
        userId: session.user.id,
        status: "COMPLETED",
      },
    });

    if (!hasStayed) {
      return NextResponse.json(
        { error: "You can only review hostels where you have completed a stay." },
        { status: 403 }
      );
    }

    // Upsert — one review per user per hostel
    const review = await db.review.upsert({
      where: { hostelId_userId: { hostelId, userId: session.user.id } },
      update: {
        ...parsed.data,
        updatedAt: new Date(),
      },
      create: {
        hostelId,
        userId: session.user.id,
        ...parsed.data,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Recompute hostel rating aggregate
    const aggregate = await db.review.aggregate({
      where: { hostelId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await db.hostel.update({
      where: { id: hostelId },
      data: {
        rating: aggregate._avg.rating ?? 0,
        reviewCount: aggregate._count.rating,
      },
    });

    return NextResponse.json({ data: review, message: "Review submitted." }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/reviews]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const hostelId = new URL(req.url).searchParams.get("hostelId");
    if (!hostelId) {
      return NextResponse.json({ error: "hostelId query param required." }, { status: 400 });
    }

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
