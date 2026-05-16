// Path: src/app/api/hostels/mine/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

/**
 * GET /api/hostels/mine
 *
 * Returns all hostels belonging to the authenticated owner,
 * regardless of status (DRAFT, PENDING_REVIEW, ACTIVE, SUSPENDED).
 *
 * Unlike GET /api/hostels (which only returns ACTIVE hostels via Typesense),
 * this endpoint is owner-scoped and returns every listing so the owner
 * dashboard can show drafts, pending, and suspended listings.
 *
 * ADMIN: returns all hostels (no ownership filter) — useful for bulk review.
 *
 * Query params:
 *   status  - filter by status (optional)
 *   page    - 1-indexed page number (default: 1)
 *   limit   - results per page (default: 50, max: 100)
 *
 * Response:
 *   { data: Hostel[], total: number, page: number, limit: number }
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

    const url    = new URL(req.url);
    const status = url.searchParams.get("status") ?? undefined;
    const page   = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const limit  = Math.min(100, parseInt(url.searchParams.get("limit") ?? "50", 10) || 50);
    const skip   = (page - 1) * limit;

    // Validate status if provided
    const validStatuses = ["DRAFT", "PENDING_REVIEW", "ACTIVE", "SUSPENDED"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value." },
        { status: 400 }
      );
    }

    const where = {
      // OWNER: scoped to their own hostels. ADMIN: all hostels.
      ...(session.user.role === "OWNER" && { ownerId: session.user.id }),
      ...(status && { status: status as any }),
    };

    const [hostels, total] = await Promise.all([
      db.hostel.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id:            true,
          name:          true,
          slug:          true,
          status:        true,
          city:          true,
          area:          true,
          pricePerMonth: true,
          rooms:         true,
          capacity:      true,
          gender:        true,
          coverImage:    true,
          verified:      true,
          featured:      true,
          rating:        true,
          reviewCount:   true,
          createdAt:     true,
          updatedAt:     true,
          // For admin view, include owner info
          ...(session.user.role === "ADMIN" && {
            owner: {
              select: { id: true, name: true, email: true },
            },
          }),
        },
      }),
      db.hostel.count({ where }),
    ]);

    return NextResponse.json({
      data:    hostels,
      total,
      page,
      limit,
      hasMore: skip + hostels.length < total,
    });
  } catch (err) {
    console.error("[GET /api/hostels/mine]", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
