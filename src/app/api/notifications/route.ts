// Path: src/app/api/notifications/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getUnreadCount, markAllNotificationsAsRead } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20));
    const skip = (page - 1) * limit;

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
    console.error("[GET /api/notifications]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    if (body?.action !== "read-all") {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    await markAllNotificationsAsRead(session.user.id);

    return NextResponse.json({ message: "All notifications marked as read." });
  } catch (err) {
    console.error("[PUT /api/notifications]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
