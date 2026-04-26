import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getUnreadCount, getRecentNotifications, markAllNotificationsAsRead } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Sign in to view notifications." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const skip = (page - 1) * limit;

    // Get unread count
    const unreadCount = await getUnreadCount(session.user.id);

    // Get paginated notifications
    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
        include: {
          booking: {
            select: {
              id: true,
              status: true,
              checkIn: true,
              hostel: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          review: {
            select: {
              id: true,
              rating: true,
              hostel: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          hostel: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      db.notification.count({
        where: {
          userId: session.user.id,
        },
      }),
    ]);

    return NextResponse.json({
      data: notifications,
      unreadCount,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    });
  } catch (err) {
    console.error("[GET /api/notifications]", err);
    return NextResponse.json(
      { error: "Failed to fetch notifications." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Sign in to manage notifications." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === "read-all") {
      await markAllNotificationsAsRead(session.user.id);
      return NextResponse.json({
        message: "All notifications marked as read.",
      });
    }

    return NextResponse.json(
      { error: "Invalid action." },
      { status: 400 }
    );
  } catch (err) {
    console.error("[PUT /api/notifications]", err);
    return NextResponse.json(
      { error: "Failed to update notifications." },
      { status: 500 }
    );
  }
}
