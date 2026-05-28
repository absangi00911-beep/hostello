// Path: src/app/api/reviews/mine/route.ts
import { type NextRequest, NextResponse } from "next/server";
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

    // Build where clause: owner sees reviews on their hostels; admin sees all
    const where =
      session.user.role === "OWNER"
        ? { hostel: { ownerId: session.user.id } }
        : {};

    const [reviews, total] = await Promise.all([
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
    ]);

    return NextResponse.json({
      data:    reviews,
      total,
      page,
      limit,
      hasMore: skip + reviews.length < total,
    });
  } catch (err) {
    console.error("[GET /api/reviews/mine]", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
