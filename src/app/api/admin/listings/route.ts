// Path: src/app/api/admin/listings/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

/**
 * GET /api/admin/listings
 *
 * Admin-only endpoint that returns hostels filtered by status.
 * Separate from PATCH /api/admin/hostels (which handles approve/suspend/activate).
 *
 * Query params:
 *   status  - "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" (required)
 *   page    - 1-indexed (default: 1)
 *   limit   - per page, max 50 (default: 20)
 *
 * Response:
 *   {
 *     data:  Hostel[],   // with owner { name, email }
 *     total: number,
 *     page:  number,
 *     limit: number,
 *   }
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url   = new URL(req.url);
    const status = url.searchParams.get("status");
    const page   = Math.max(1, parseInt(url.searchParams.get("page")  ?? "1",  10) || 1);
    const limit  = Math.min(50, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20);
    const skip   = (page - 1) * limit;

    const validStatuses = ["DRAFT", "PENDING_REVIEW", "ACTIVE", "SUSPENDED"];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "status query param is required: DRAFT | PENDING_REVIEW | ACTIVE | SUSPENDED" },
        { status: 400 }
      );
    }

    const where = { status: status as any };

    const [hostels, total] = await Promise.all([
      db.hostel.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id:        true,
          name:      true,
          slug:      true,
          status:    true,
          city:      true,
          verified:  true,
          createdAt: true,
          owner: {
            select: { id: true, name: true, email: true },
          },
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
    console.error("[GET /api/admin/listings]", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}