// Path: src/app/api/reviews/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { reviewSchema } from "@hostello/shared";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { indexSingleHostel } from "@/lib/typesense-sync";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { parsePagination } from "@/lib/pagination";
import { readBoundedJson } from "@/lib/bounded-json";
import { getIp, rateLimit } from "@/lib/rate-limit";
import { isBoundedRouteParam } from "@/lib/route-params";

const PUBLIC_REVIEW_READS_PER_MINUTE = 120;
const ADMIN_REVIEW_READS_PER_MINUTE = 60;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const hostelId = url.searchParams.get("hostelId");
    const { page, limit, skip } = parsePagination(url.searchParams, { defaultLimit: 20, maxLimit: 50 });

    if (url.search.length > 1_024 || (hostelId !== null && hostelId.length > 64)) {
      return NextResponse.json({ error: "Invalid review filters." }, { status: 400 });
    }

    if (!hostelId) {
      const session = await auth();
      if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const adminLimit = await rateLimit(`reviews:admin:${session.user.id}`, {
        limit: ADMIN_REVIEW_READS_PER_MINUTE,
        windowMs: 60_000,
      });
      if (!adminLimit.ok) {
        return NextResponse.json(
          { error: "Too many review-list requests. Please slow down." },
          {
            status: 429,
            headers: { "Retry-After": String(Math.max(1, Math.ceil((adminLimit.resetAt - Date.now()) / 1000))) },
          },
        );
      }

      const [reviews, total] = await Promise.all([
        db.review.findMany({
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: {
            user: { select: { id: true, name: true, email: true } },
            hostel: { select: { id: true, name: true, slug: true } },
          },
        }),
        db.review.count(),
      ]);

      return NextResponse.json({ data: reviews, total, page, limit });
    }

    const publicLimit = await rateLimit(`reviews:public:${getIp(req)}`, {
      limit: PUBLIC_REVIEW_READS_PER_MINUTE,
      windowMs: 60_000,
    });
    if (!publicLimit.ok) {
      return NextResponse.json(
        { error: "Too many review requests. Please slow down." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(1, Math.ceil((publicLimit.resetAt - Date.now()) / 1000))) },
        },
      );
    }

    const publicHostel = await db.hostel.findFirst({
      where: { id: hostelId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!publicHostel) return NextResponse.json({ error: "Hostel not found." }, { status: 404 });

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where: { hostelId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      }),
      db.review.count({ where: { hostelId } }),
    ]);

    return NextResponse.json({ data: reviews, total, page, limit });
  } catch (err) {
    console.error("[GET /api/reviews]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Student accounts only." }, { status: 403 });
    }

    const limit = await rateLimit(`review:${session.user.id}`, {
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    if (!limit.ok) return NextResponse.json({ error: "Too many review updates. Try again later." }, { status: 429 });

    const body = await readBoundedJson(req, 8_192);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    const bodyData = body.data;
    if (!bodyData || typeof bodyData !== "object" || Array.isArray(bodyData)) {
      return NextResponse.json({ error: "Validation failed." }, { status: 400 });
    }
    const hostelId = typeof (bodyData as Record<string, unknown>).hostelId === "string"
      ? (bodyData as Record<string, string>).hostelId
      : "";
    const parsed = reviewSchema.safeParse(bodyData);

    if (!isBoundedRouteParam(hostelId) || !parsed.success) {
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
      const wouldRecommend = typeof (bodyData as Record<string, unknown>).wouldRecommend === "boolean"
        ? (bodyData as Record<string, boolean>).wouldRecommend
        : undefined;

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
        console.warn(
          "[POST /api/reviews] Typesense sync failed:",
          getSafeErrorSummary(err),
        );
      });
    }

    return NextResponse.json(
      { data: review, message: "Review submitted." },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/reviews]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
