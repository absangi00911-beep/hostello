import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { markNotificationAsRead } from "@/lib/notifications";

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

    const { id } = await params;

    // Verify ownership
    const notification = await db.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found." },
        { status: 404 }
      );
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 403 }
      );
    }

    await markNotificationAsRead(id, session.user.id);

    return NextResponse.json({
      message: "Notification marked as read.",
    });
  } catch (err) {
    console.error(`[PUT /api/notifications/[id]]`, err);
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

    const { id } = await params;

    // Verify ownership
    const notification = await db.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found." },
        { status: 404 }
      );
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 403 }
      );
    }

    await db.notification.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Notification deleted.",
    });
  } catch (err) {
    console.error(`[DELETE /api/notifications/[id]]`, err);
    return NextResponse.json(
      { error: "Failed to delete notification." },
      { status: 500 }
    );
  }
}
