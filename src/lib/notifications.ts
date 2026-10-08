// Path: src/lib/notifications.ts

import { db } from "@/lib/db";
import { NotificationType } from "@/generated/enums";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { getMessaging } from "firebase-admin/messaging";
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
  /** Push-only route context. Not persisted in the notification row. */
  conversationId?: string;
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
  conversationId,
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

    // Dispatch push notification to mobile devices (fire-and-forget)
    sendPushNotification(userId, {
      title,
      // Message content stays in the authenticated inbox; push surfaces only
      // a generic preview that is safer on a shared lock screen.
      body: type === "MESSAGE_RECEIVED" ? "You have a new message." : message,
      data: {
        type,
        notificationId: notification.id,
        ...(bookingId && { bookingId }),
        ...(reviewId && { reviewId }),
        ...(hostelId && { hostelId }),
        ...(conversationId && { conversationId }),
      },
    }, { notificationType: type, logContext }).catch((err) => {
      const summary = getSafeErrorSummary(err);
      logOperationalEvent("error", "notification.dispatch_failed", {
        notification_type: type,
        error_name: summary.name,
        ...(summary.code ? { error_code: summary.code } : {}),
      }, logContext);
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

/**
 * Sends a push notification to all registered devices for a user.
 *
 * @param userId - ID of the user to receive the notification
 * @param payload - Notification content and data
 */
export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; data?: Record<string, string> },
  options: { notificationType?: NotificationType; logContext?: OperationalLogContext } = {},
) {
  const admin = getFirebaseAdmin();
  if (!admin) return;

  try {
    // 1. Fetch active device tokens for the user
    const devices = await db.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (devices.length === 0) return;

    const tokens = devices.map((d) => d.token);

    // 2. Construct the FCM message
    // We use a multicast message to send to all tokens at once.
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      tokens,
    };

    // 3. Send via FCM
    const response = await getMessaging().sendEachForMulticast(message);

    // 4. Handle stale tokens (UNREGISTERED)
    if (response.failureCount > 0) {
      const staleTokens: string[] = [];
      response.responses.forEach((res, idx) => {
        if (!res.success && res.error) {
          const code = res.error.code;
          if (
            code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token"
          ) {
            staleTokens.push(tokens[idx]);
          }
        }
      });

      if (staleTokens.length > 0) {
        await db.deviceToken.deleteMany({
          where: { token: { in: staleTokens } },
        });
      }

      const otherFailures = response.failureCount - staleTokens.length;
      if (otherFailures > 0) {
        logOperationalEvent("warn", "notification.push.partial_failure", {
          ...(options.notificationType ? { notification_type: options.notificationType } : {}),
          failure_count: response.failureCount,
          success_count: response.successCount,
          stale_token_count: staleTokens.length,
        }, options.logContext);
      }
    }
  } catch (err) {
    const summary = getSafeErrorSummary(err);
    logOperationalEvent("error", "notification.push.dispatch_failed", {
      ...(options.notificationType ? { notification_type: options.notificationType } : {}),
      error_name: summary.name,
      ...(summary.code ? { error_code: summary.code } : {}),
      ...(summary.status ? { error_status: summary.status } : {}),
    }, options.logContext);
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
