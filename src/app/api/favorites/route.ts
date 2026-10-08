import { getSafeErrorSummary } from "@/lib/safe-error";
// Path: src/app/api/favorites/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { parsePagination } from "@/lib/pagination";
import { rateLimit } from "@/lib/rate-limit";

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
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (req.nextUrl.search.length > 1_024) {
      return NextResponse.json({ error: "Query is too long." }, { status: 400 });
    }

    const { page, limit, skip } = parsePagination(req.nextUrl.searchParams, {
      defaultLimit: 20,
      maxLimit: 50,
    });
    const listLimit = await rateLimit(`favorites:list:${session.user.id}`, {
      limit: 60,
      windowMs: 60_000,
    });
    if (!listLimit.ok) {
      return NextResponse.json(
        { error: "Too many saved-hostel requests. Please slow down." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(1, Math.ceil((listLimit.resetAt - Date.now()) / 1000))) },
        },
      );
    }

    const where = { userId: session.user.id, hostel: { status: "ACTIVE" as const } };
    const [favorites, total] = await Promise.all([
      db.favorite.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
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
          },
        },
      },
      }),
      db.favorite.count({ where }),
    ]);

    const activeFavorites = favorites.map((favorite) => favorite.hostel);

    return NextResponse.json({
      data: activeFavorites,
      total,
      page,
      limit,
      hasMore: skip + activeFavorites.length < total,
    });
  } catch (err) {
    console.error("[GET /api/favorites]", getSafeErrorSummary(err));
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
