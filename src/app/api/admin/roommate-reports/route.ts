import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { parsePagination } from "@/lib/pagination";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { ROOMMATE_POST_HIDE_REPORT_THRESHOLD } from "@/lib/roommate-policy";
import { enforceAdminReadLimit } from "@/lib/admin-read-limit";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const readLimitResponse = await enforceAdminReadLimit(session.user.id);
    if (readLimitResponse) return readLimitResponse;

    const url = new URL(req.url);
    const { page, limit, skip } = parsePagination(url.searchParams, {
      defaultLimit: 20,
      maxLimit: 50,
    });
    const where = { reports: { some: {} } };

    const [posts, total] = await Promise.all([
      db.roommatePost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          bio: true,
          budget: true,
          moveIn: true,
          createdAt: true,
          expiresAt: true,
          hostel: { select: { id: true, name: true, slug: true } },
          user: { select: { id: true, name: true } },
          reports: {
            orderBy: { createdAt: "desc" },
            take: 50,
            select: {
              id: true,
              reason: true,
              createdAt: true,
              reporter: { select: { id: true, name: true } },
            },
          },
          _count: { select: { reports: true } },
        },
      }),
      db.roommatePost.count({ where }),
    ]);

    return NextResponse.json({
      data: posts,
      total,
      page,
      limit,
      hideThreshold: ROOMMATE_POST_HIDE_REPORT_THRESHOLD,
    });
  } catch (error) {
    console.error("[GET /api/admin/roommate-reports]", getSafeErrorSummary(error));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
