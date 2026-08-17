// Path: src/app/api/reviews/mine/route.ts
import { type NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/client";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

/**
 * GET /api/reviews/mine
 *
 * Returns all reviews across every hostel owned by the authenticated user.
 * Used by the owner dashboard Reviews tab.
 *
 * ADMIN: returns all reviews on the platform (no ownership filter).
 *
 * Query params:
 *   page  - 1-indexed (default: 1)
 *   limit - per page, max 50 (default: 20)
 *
 * Response:
 *   { data: Review[], total: number, page: number, limit: number }
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url   = new URL(req.url);
    const page  = Math.max(1, parseInt(url.searchParams.get("page")  ?? "1",  10) || 1);
    const limit = Math.min(50, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20);
    const skip  = (page - 1) * limit;
    const filter = url.searchParams.get("filter"); // pending | replied | flagged
    const search = url.searchParams.get("search")?.trim();

    // Ownership only — used for stats, which should stay stable regardless
    // of which tab is active. The tab/search filter is layered on top of
    // this separately, for the review *list* only.
    const baseWhere: Prisma.ReviewWhereInput =
      session.user.role === "OWNER"
        ? { hostel: { ownerId: session.user.id } }
        : {};

    const where: Prisma.ReviewWhereInput = { ...baseWhere };

    if (filter === "pending") where.ownerReply = null;
    if (filter === "replied") where.ownerReply = { not: null };
    // No flagging mechanism exists on Review — "flagged" is a derived proxy
    // for "needs urgent attention": low-rated reviews, same spirit as the
    // completeness-based "flagged" used on the hostel moderation page.
    if (filter === "flagged") where.rating = { lte: 2 };

    if (search) {
      where.OR = [
        { comment: { contains: search, mode: "insensitive" } },
        { user:    { name: { contains: search, mode: "insensitive" } } },
        { hostel:  { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [reviews, filteredTotal, statsTotal, newThisWeek, avgAgg, repliedCount] = await Promise.all([
      db.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
          hostel: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
      db.review.count({ where }),
      db.review.count({ where: baseWhere }),
      db.review.count({ where: { ...baseWhere, createdAt: { gte: weekAgo } } }),
      db.review.aggregate({ where: baseWhere, _avg: { rating: true } }),
      db.review.count({ where: { ...baseWhere, ownerReply: { not: null } } }),
    ]);

    // Attach the matching completed booking's dates for context ("Stayed
    // Oct 12 - Oct 15"). Reviews aren't tied to a specific booking (the
    // uniqueness constraint is hostelId+userId), so this is a best-effort
    // lookup, batched to avoid one query per review.
    const pairs = reviews.map((r) => ({ hostelId: r.hostelId, userId: r.userId }));
    const bookings = pairs.length
      ? await db.booking.findMany({
          where: { OR: pairs, status: "COMPLETED" },
          orderBy: { checkOut: "desc" },
          select: { hostelId: true, userId: true, checkIn: true, checkOut: true, months: true },
        })
      : [];
    const bookingFor = (hostelId: string, userId: string) =>
      bookings.find((b) => b.hostelId === hostelId && b.userId === userId) ?? null;

    const reviewsWithStay = reviews.map((r) => ({
      ...r,
      stay: bookingFor(r.hostelId, r.userId),
    }));

    const avgRating = avgAgg._avg.rating ?? null;
    const responseRate = statsTotal > 0 ? (repliedCount / statsTotal) * 100 : null;
    // Rating-derived label, not text sentiment analysis — HostelLo has no
    // NLP/sentiment pipeline, so this is an honest proxy, not a claim that
    // review text was analyzed.
    const sentiment =
      avgRating === null ? null :
      avgRating >= 4.5 ? "Excellent" :
      avgRating >= 4.0 ? "Positive" :
      avgRating >= 3.0 ? "Mixed" : "Needs Improvement";

    return NextResponse.json({
      data:    reviewsWithStay,
      total:   filteredTotal,
      page,
      limit,
      hasMore: skip + reviews.length < filteredTotal,
      stats: {
        total: statsTotal,
        newThisWeek,
        avgRating,
        responseRate,
        repliedCount,
        sentiment,
      },
    });
  } catch (err) {
    console.error("[GET /api/reviews/mine]", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
