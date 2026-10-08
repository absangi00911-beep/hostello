import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { indexSingleHostel } from "@/lib/typesense-sync";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { rateLimit } from "@/lib/rate-limit";
import { isBoundedRouteParam } from "@/lib/route-params";

/**
 * DELETE /api/reviews/[id]
 * Admin moderation endpoint for removing a review.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const moderationLimit = await rateLimit(`admin-review-delete:${session.user.id}`, {
      limit: 30,
      windowMs: 60_000,
    });
    if (!moderationLimit.ok) {
      return NextResponse.json(
        { error: "Too many review moderation actions. Try again shortly." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(1, Math.ceil((moderationLimit.resetAt - Date.now()) / 1000))) },
        },
      );
    }

    const { id } = await params;
    if (!isBoundedRouteParam(id)) {
      return NextResponse.json({ error: "Invalid review." }, { status: 400 });
    }
    const deleted = await db.$transaction(async (tx) => {
      const review = await tx.review.findUnique({
        where: { id },
        select: { id: true, hostelId: true },
      });
      if (!review) return null;

      await tx.review.delete({ where: { id: review.id } });

      const aggregate = await tx.review.aggregate({
        where: { hostelId: review.hostelId },
        _avg: { rating: true },
        _count: { rating: true },
      });
      const reviewCount = typeof aggregate._count === "number"
        ? aggregate._count
        : aggregate._count.rating;

      await tx.hostel.update({
        where: { id: review.hostelId },
        data: {
          rating: aggregate._avg.rating ?? 0,
          reviewCount,
        },
      });

      return { hostelId: review.hostelId };
    });

    if (!deleted) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    void indexSingleHostel(deleted.hostelId).catch((err) => {
      console.warn("[DELETE /api/reviews/[id]] Typesense sync failed:", getSafeErrorSummary(err));
    });

    return NextResponse.json({ message: "Review deleted." });
  } catch (err) {
    console.error("[DELETE /api/reviews/[id]]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
