// Path: src/lib/notifications.ts

import { db } from "@/lib/db";
import { NotificationType } from "@/generated/enums";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { logOperationalEvent, type OperationalLogContext } from "@/lib/operational-logger";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  bookingId?: string;
  reviewId?: string;
  hostelId?: string;
  /** Optional request/trace context inherited from the operation that triggered this notification. */
  logContext?: OperationalLogContext;
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  bookingId,
  reviewId,
  hostelId,
  logContext,
}: CreateNotificationInput) {
  try {
    const notification = await db.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        bookingId,
        reviewId,
        hostelId,
      },
    });

    return notification;
  } catch (err) {
    // Fire-and-forget callers — log but never throw
    const summary = getSafeErrorSummary(err);
    logOperationalEvent("error", "notification.persist_failed", {
      notification_type: type,
      error_name: summary.name,
      ...(summary.code ? { error_code: summary.code } : {}),
    }, logContext);
    return null;
  }
}

export async function getUnreadCount(userId: string) {
  try {
    return await db.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  } catch (err) {
    console.error("[getUnreadCount]", getSafeErrorSummary(err));
    throw err;
  }
}

export async function getRecentNotifications(userId: string, limit = 10) {
  try {
    return await db.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
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
    });
  } catch (err) {
    console.error("[getRecentNotifications]", getSafeErrorSummary(err));
    throw err;
  }
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
) {
  try {
    return await db.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  } catch (err) {
    console.error("[markNotificationAsRead]", getSafeErrorSummary(err));
    throw err;
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    return await db.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  } catch (err) {
    console.error("[markAllNotificationsAsRead]", getSafeErrorSummary(err));
    throw err;
  }
}
