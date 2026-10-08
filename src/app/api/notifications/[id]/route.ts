import { getSafeErrorSummary } from "@/lib/safe-error";
// Path: src/app/api/notifications/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { markNotificationAsRead } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";
import { isBoundedRouteParam } from "@/lib/route-params";

async function checkNotificationWriteLimit(userId: string) {
  const quota = await rateLimit(`notifications:write:${userId}`, { limit: 60, windowMs: 60_000 });
  if (quota.ok) return null;

  return NextResponse.json(
    { error: "Too many notification requests. Please try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, Math.ceil((quota.resetAt - Date.now()) / 1000))) },
    },
  );
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Sign in to manage notifications." },
        { status: 401 }
      );
    }

    const limitResponse = await checkNotificationWriteLimit(session.user.id);
    if (limitResponse) return limitResponse;

    const { id } = await params;
    if (!isBoundedRouteParam(id)) {
      return NextResponse.json({ error: "Invalid notification." }, { status: 400 });
    }

    const updated = await markNotificationAsRead(id, session.user.id);
    if (updated.count !== 1) {
      return NextResponse.json(
        { error: "Notification not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Notification marked as read.",
    });
  } catch (err) {
    console.error(`[PUT /api/notifications/[id]]`, getSafeErrorSummary(err));
    return NextResponse.json(
      { error: "Failed to update notification." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Sign in to manage notifications." },
        { status: 401 }
      );
    }

    const limitResponse = await checkNotificationWriteLimit(session.user.id);
    if (limitResponse) return limitResponse;

    const { id } = await params;
    if (!isBoundedRouteParam(id)) {
      return NextResponse.json({ error: "Invalid notification." }, { status: 400 });
    }

    const deleted = await db.notification.deleteMany({
      where: { id, userId: session.user.id },
    });
    if (deleted.count !== 1) {
      return NextResponse.json(
        { error: "Notification not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Notification deleted.",
    });
  } catch (err) {
    console.error(`[DELETE /api/notifications/[id]]`, getSafeErrorSummary(err));
    return NextResponse.json(
      { error: "Failed to delete notification." },
      { status: 500 }
    );
  }
}
