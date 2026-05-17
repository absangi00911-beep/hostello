// Path: src/app/api/cron/cancel-abandoned-payments/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyUpstashRequest } from "@/lib/verify-upstash";
import { runCronJob } from "@/lib/cron-utils";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    await verifyUpstashRequest(req, { acceptBearerToken: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runCronJob("cancel-abandoned-payments", async () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const abandonedBookings = await db.booking.findMany({
      where: {
        status:        "PENDING",
        paymentStatus: "PENDING",
        createdAt:     { lt: thirtyMinutesAgo },
      },
      select: { id: true, roomId: true },
    });

    if (abandonedBookings.length === 0) {
      return { message: "No abandoned payments found", count: 0 };
    }

    const result = await db.$transaction(async (tx) => {
      const bookingIds = abandonedBookings.map((b) => b.id);

      const cancelled = await tx.booking.updateMany({
        where: { id: { in: bookingIds } },
        data:  { status: "CANCELLED", paymentStatus: "FAILED" },
      });

      const roomBookings = abandonedBookings.filter((b) => b.roomId !== null);
      for (const booking of roomBookings) {
        if (booking.roomId) {
          await tx.room.update({
            where: { id: booking.roomId },
            data:  { available: { increment: 1 }, version: { increment: 1 } },
          });
        }
      }

      return { cancelled: cancelled.count, roomsRestored: roomBookings.length };
    });

    return {
      message:       "Abandoned payments cancelled",
      count:         result.cancelled,
      roomsRestored: result.roomsRestored,
    };
  });
}