// Path: src/app/api/favorites/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

/**
 * GET /api/favorites
 *
 * Returns all hostels saved by the authenticated user.
 * Used by the student dashboard "Saved Hostels" tab.
 *
 * Response:
 *   { data: Hostel[] }
 *
 * Each hostel includes the same fields as GET /api/hostels search results
 * so the SavedHostelCard component can render without a separate fetch.
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const favorites = await db.favorite.findMany({
      where:   { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        hostel: {
          select: {
            id:           true,
            name:         true,
            slug:         true,
            city:         true,
            area:         true,
            pricePerMonth: true,
            gender:       true,
            amenities:    true,
            coverImage:   true,
            images:       true,
            verified:     true,
            featured:     true,
            rating:       true,
            reviewCount:  true,
            capacity:     true,
            rooms:        true,
            status:       true,
          },
        },
      },
    });

    // Filter out hostels that were deleted or suspended after being saved.
    // Don't surface SUSPENDED or DRAFT hostels in the student's saved list.
    const activeFavorites = favorites
      .filter((f) => f.hostel.status === "ACTIVE")
      .map((f) => f.hostel);

    return NextResponse.json({ data: activeFavorites });
  } catch (err) {
    console.error("[GET /api/favorites]", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
