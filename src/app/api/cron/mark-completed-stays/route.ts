import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyUpstashRequest } from "@/lib/verify-upstash";
import { sendPushNotification } from "@/lib/notifications";
import { runCronJob } from "@/lib/cron-utils";
import { createOperationalLogContext } from "@/lib/operational-logger";

export const maxDuration = 60;
const BATCH_SIZE = 100;

export async function POST(req: NextRequest) {
  try {
    await verifyUpstashRequest(req, { acceptBearerToken: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logContext = createOperationalLogContext(req);
  return runCronJob("mark-completed-stays", async (context) => {
    const now = new Date();
    let completedCount = 0;
    let notifiedCount = 0;

    while (true) {
      const candidates = await db.booking.findMany({
        where: { status: "CONFIRMED", checkOut: { lt: now } },
        orderBy: [{ checkOut: "asc" }, { id: "asc" }],
        take: BATCH_SIZE,
        select: {
          id: true,
          userId: true,
          hostelId: true,
          checkOut: true,
          hostel: { select: { name: true } },
        },
      });

      if (candidates.length === 0) break;

      // Update and persist in-app notifications in one transaction. The status
      // predicate makes overlapping cron runs produce one transition and one
      // notification per booking. Push is best-effort after the commit.
      const batch = await db.$transaction(async (tx) => {
        let completed = 0;
        const notifications: Array<{
          userId: string;
          notificationId: string;
          title: string;
          message: string;
          bookingId: string;
          hostelId: string;
        }> = [];

        for (const booking of candidates) {
          const transition = await tx.booking.updateMany({
            where: {
              id: booking.id,
              status: "CONFIRMED",
              checkOut: { lt: now },
            },
            data: { status: "COMPLETED" },
          });
          if (transition.count === 0) continue;

          const title = "Stay completed";
          const message = `Your stay at ${booking.hostel.name} is complete. Leave a review to help other students.`;
          const notification = await tx.notification.create({
            data: {
              userId: booking.userId,
              type: "BOOKING_COMPLETED",
              title,
              message,
              bookingId: booking.id,
              hostelId: booking.hostelId,
            },
            select: { id: true },
          });

          completed++;
          notifications.push({
            userId: booking.userId,
            notificationId: notification.id,
            title,
            message,
            bookingId: booking.id,
            hostelId: booking.hostelId,
          });
        }

        return { completed, notifications };
      });

      completedCount += batch.completed;
      notifiedCount += batch.notifications.length;
      await Promise.all(batch.notifications.map((notification) =>
        sendPushNotification(notification.userId, {
          title: notification.title,
          body: notification.message,
          data: {
            type: "BOOKING_COMPLETED",
            notificationId: notification.notificationId,
            bookingId: notification.bookingId,
            hostelId: notification.hostelId,
          },
        }, { notificationType: "BOOKING_COMPLETED", logContext: context }),
      ));

      if (candidates.length < BATCH_SIZE) break;
    }

    return {
      message: completedCount === 0 ? "No stays to complete" : "Completed stays marked",
      count: completedCount,
      notified: notifiedCount,
    };
  }, logContext);
}
