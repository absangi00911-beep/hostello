import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyUpstashRequest } from "@/lib/verify-upstash";

/**
 * Cron job to cancel bookings stuck in PENDING payment status.
 *
 * Bookings created but payment never initiated or abandoned after 30 minutes
 * should be cancelled to free up hostel capacity.
 *
 * Trigger: Via Vercel Cron every 5 minutes
 * Endpoint: POST /api/cron/cancel-abandoned-payments
 *
 * Required env vars:
 *   CRON_SECRET - to verify requests (set same value in Vercel)
 */

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // Verify request is from Upstash or authorized source
    try {
      await verifyUpstashRequest(req, { acceptBearerToken: true });
    } catch (error) {
      console.warn(
        "[cron] Unauthorized cancel-abandoned-payments request:",
        error instanceof Error ? error.message : String(error)
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Find abandoned bookings first so we can restore room availability
    const abandonedBookings = await db.booking.findMany({
      where: {
        status: "PENDING",
        paymentStatus: "PENDING",
        createdAt: { lt: thirtyMinutesAgo },
      },
      select: { id: true, roomId: true },
    });

    if (abandonedBookings.length === 0) {
      return NextResponse.json({
        message: "No abandoned payments found",
        count: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Use a transaction to atomically cancel bookings and restore room availability
    const result = await db.$transaction(async (tx) => {
      const bookingIds = abandonedBookings.map((b) => b.id);

      // Cancel all abandoned bookings
      const cancelled = await tx.booking.updateMany({
        where: { id: { in: bookingIds } },
        data: {
          status: "CANCELLED",
          paymentStatus: "FAILED",
        },
      });

      // Restore room availability for bookings that had a specific room assigned
      const roomBookings = abandonedBookings.filter((b) => b.roomId !== null);
      for (const booking of roomBookings) {
        if (booking.roomId) {
          await tx.room.update({
            where: { id: booking.roomId },
            data: {
              available: { increment: 1 },
              version: { increment: 1 },
            },
          });
        }
      }

      return { cancelled: cancelled.count, roomsRestored: roomBookings.length };
    });

    console.log(
      `[cron] Cancelled ${result.cancelled} abandoned payment bookings, restored ${result.roomsRestored} rooms`
    );

    return NextResponse.json({
      message: "Abandoned payments cancelled",
      count: result.cancelled,
      roomsRestored: result.roomsRestored,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron] cancel-abandoned-payments failed:", err);
    return NextResponse.json(
      { error: "Cron job failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}