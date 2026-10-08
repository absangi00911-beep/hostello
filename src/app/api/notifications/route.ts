import { getSafeErrorSummary } from "@/lib/safe-error";
// Path: src/app/api/notifications/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { parsePagination } from "@/lib/pagination";
import { getUnreadCount, markAllNotificationsAsRead } from "@/lib/notifications";
import { readBoundedJson } from "@/lib/bounded-json";
import { rateLimit } from "@/lib/rate-limit";

function rateLimitResponse(resetAt: number) {
  return NextResponse.json(
    { error: "Too many notification requests. Please try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))) },
    },
  );
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const quota = await rateLimit(`notifications:list:${session.user.id}`, { limit: 60, windowMs: 60_000 });
    if (!quota.ok) return rateLimitResponse(quota.resetAt);

    const url = new URL(req.url);
    const { page, limit, skip } = parsePagination(url.searchParams, { defaultLimit: 20, maxLimit: 100 });

    const where = { userId: session.user.id };
    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.notification.count({ where }),
      getUnreadCount(session.user.id),
    ]);

    return NextResponse.json({
      data: notifications,
      unreadCount,
      total,
      page,
      limit,
      hasMore: skip + notifications.length < total,
    });
  } catch (err) {
    console.error("[GET /api/notifications]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const quota = await rateLimit(`notifications:read-all:${session.user.id}`, { limit: 5, windowMs: 60_000 });
    if (!quota.ok) return rateLimitResponse(quota.resetAt);

    const body = await readBoundedJson(req, 1_024);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    if (!body.data || typeof body.data !== "object" || Array.isArray(body.data) || (body.data as Record<string, unknown>).action !== "read-all") {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    await markAllNotificationsAsRead(session.user.id);

    return NextResponse.json({ message: "All notifications marked as read." });
  } catch (err) {
    console.error("[PUT /api/notifications]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
