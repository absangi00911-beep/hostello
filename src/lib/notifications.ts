import { db } from "@/lib/db";
import { NotificationType } from "@prisma/client";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  bookingId?: string;
  reviewId?: string;
  hostelId?: string;
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  bookingId,
  reviewId,
  hostelId,
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
      body: message,
      data: {
        type,
        notificationId: notification.id,
        ...(bookingId && { bookingId }),
        ...(reviewId && { reviewId }),
        ...(hostelId && { hostelId }),
      },
    }).catch((err) => {
      console.error("[createNotification] Push dispatch failed:", err);
    });

    return notification;
  } catch (err) {
    // Fire-and-forget callers — log but never throw
    console.error("[createNotification]", err);
    return null;
  }
}

/**
 * Sends a push notification to all registered devices for a user.
 *
 * @param userId - ID of the user to receive the notification
 * @param payload - Notification content and data
 */
async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; data?: Record<string, string> }
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
    const response = await admin.messaging().sendEachForMulticast(message);

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
    }
  } catch (err) {
    console.error("[sendPushNotification] Error:", err);
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
    console.error("[getUnreadCount]", err);
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
    console.error("[getRecentNotifications]", err);
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
    console.error("[markNotificationAsRead]", err);
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
    console.error("[markAllNotificationsAsRead]", err);
    throw err;
  }
}
