// Path: src/app/api/cron/mark-completed-stays/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyUpstashRequest } from "@/lib/verify-upstash";
import { createNotification } from "@/lib/notifications";
import { runCronJob } from "@/lib/cron-utils";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    await verifyUpstashRequest(req, { acceptBearerToken: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runCronJob("mark-completed-stays", async () => {
    const now = new Date();

    const bookingsToComplete = await db.booking.findMany({
      where:  { status: "CONFIRMED", checkOut: { lt: now } },
      select: {
        id:       true,
        userId:   true,
        hostelId: true,
        hostel:   { select: { name: true } },
      },
    });

    if (bookingsToComplete.length === 0) {
      return { message: "No stays to complete", count: 0, notified: 0 };
    }

    const bookingIds = bookingsToComplete.map((b) => b.id);
    const result = await db.booking.updateMany({
      where: { id: { in: bookingIds }, status: "CONFIRMED" },
      data:  { status: "COMPLETED" },
    });

    const notifications = await Promise.allSettled(
      bookingsToComplete.map((booking) =>
        createNotification({
          userId:    booking.userId,
          type:      "BOOKING_COMPLETED",
          title:     "Stay completed",
          message:   `Your stay at ${booking.hostel.name} is complete. Leave a review to help other students.`,
          bookingId: booking.id,
          hostelId:  booking.hostelId,
        }),
      ),
    );

    const notified = notifications.filter((r) => r.status === "fulfilled").length;
    const nFailed  = notifications.filter((r) => r.status === "rejected").length;

    return {
      message:  "Completed stays marked",
      count:    result.count,
      notified,
      nFailed,
    };
  });
}