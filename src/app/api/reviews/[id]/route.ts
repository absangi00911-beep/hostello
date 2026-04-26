import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { reviewSchema } from "@/lib/validations";
import { indexSingleHostel } from "@/lib/typesense-sync";

/**
 * PUT /api/reviews/[id]
 * 
 * Allows a student to edit their own review.
 * Requires: Review ownership verification
 * 
 * Request: { rating, title?, comment, cleanliness?, location?, value?, safety? }
 * Response: { data: Review }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Sign in to edit a review." }, { status: 401 });
    }

    const { id } = await params;

    // Fetch existing review
    const existingReview = await db.review.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        hostelId: true,
      },
    });

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    // Verify ownership (only the review author can edit)
    const isAuthor = existingReview.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "You can only edit your own reviews." },
        { status: 403 }
      );
    }

    // Parse and validate updated review data
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Update review in transaction
    const updatedReview = await db.$transaction(async (tx) => {
      // Update the review
      const review = await tx.review.update({
        where: { id },
        data: {
          ...parsed.data,
          updatedAt: new Date(),
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      });

      // Recompute hostel rating
      const aggregate = await tx.review.aggregate({
        where: { hostelId: existingReview.hostelId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.hostel.update({
        where: { id: existingReview.hostelId },
        data: {
          rating: aggregate._avg.rating ?? 0,
          reviewCount: aggregate._count.rating,
        },
      });

      return review;
    });

    // Sync updated rating to Typesense
    void indexSingleHostel(existingReview.hostelId).catch((err) =>
      console.error(`[typesense] Failed to sync hostel ${existingReview.hostelId} after review update:`, err)
    );

    return NextResponse.json({ data: updatedReview, message: "Review updated." });
  } catch (err) {
    console.error("[PUT /api/reviews/[id]]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

/**
 * DELETE /api/reviews/[id]
 * 
 * Allows a student to delete their own review.
 * Requires: Review ownership verification
 * 
 * Response: { message: "Review deleted" }
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

    // Fetch review with hostel info
    const review = await db.review.findUnique({
      where: { id },
      select: {
        userId: true,
        hostelId: true,
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    // Verify ownership
    const isAuthor = review.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "You can only delete your own reviews." },
        { status: 403 }
      );
    }

    // Delete review in transaction to update hostel rating
    await db.$transaction(async (tx) => {
      // Delete the review
      await tx.review.delete({ where: { id } });

      // Recompute hostel rating and review count
      const aggregate = await tx.review.aggregate({
        where: { hostelId: review.hostelId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.hostel.update({
        where: { id: review.hostelId },
        data: {
          rating: aggregate._avg.rating ?? 0,
          reviewCount: aggregate._count.rating,
        },
      });
    });

    // Sync updated rating to Typesense
    void indexSingleHostel(review.hostelId).catch((err) =>
      console.error(`[typesense] Failed to sync hostel ${review.hostelId} after review deletion:`, err)
    );

    return NextResponse.json({ message: "Review deleted." });
  } catch (err) {
    console.error("[DELETE /api/reviews/[id]]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
