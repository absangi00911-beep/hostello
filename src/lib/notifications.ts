"use server";

import { db } from "@/lib/db";
import { NotificationType } from "@prisma/client";

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
    return await db.notification.create({
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
  } catch (err) {
    console.error("[createNotification]", err);
    throw err;
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
