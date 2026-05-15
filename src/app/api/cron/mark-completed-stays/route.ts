// Path: src/app/api/cron/mark-completed-stays/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyUpstashRequest } from "@/lib/verify-upstash";
import { createNotification } from "@/lib/notifications";

/**
 * POST /api/cron/mark-completed-stays
 *
 * Transitions CONFIRMED bookings to COMPLETED after their checkOut date passes,
 * then notifies each student so they know they can now leave a review.
 *
 * Trigger: Upstash QStash, daily at 00:00 UTC
 *
 * Why findMany → updateMany instead of a single updateMany:
 *   updateMany returns only a count, not the affected records. We need the
 *   userId, hostelId, and hostel name of each completed booking to build
 *   per-student notifications. Fetching first and updating by explicit IDs
 *   also avoids a race window where a new booking could become eligible
 *   between the start and end of a single updateMany.
 */

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // ── Auth ───────────────────────────────────────────────────────────────
    try {
      await verifyUpstashRequest(req, { acceptBearerToken: true });
    } catch (error) {
      console.warn(
        "[cron] Unauthorized mark-completed-stays request:",
        error instanceof Error ? error.message : String(error),
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // ── Step 1: Find all bookings that need completing ─────────────────────
    // Select only the fields needed for notifications — no over-fetching.
    const bookingsToComplete = await db.booking.findMany({
      where: {
        status: "CONFIRMED",
        checkOut: { lt: now },
      },
      select: {
        id:       true,
        userId:   true,
        hostelId: true,
        hostel: {
          select: { name: true },
        },
      },
    });

    if (bookingsToComplete.length === 0) {
      console.log("[cron] mark-completed-stays: no bookings to complete");
      return NextResponse.json({
        message: "No stays to complete",
        count:     0,
        notified:  0,
        timestamp: new Date().toISOString(),
      });
    }

    // ── Step 2: Update exactly those bookings ──────────────────────────────
    // Scoping to explicit IDs + re-checking status:"CONFIRMED" prevents a
    // race condition where a booking is cancelled between the findMany above
    // and this update (e.g. the student cancels at 23:59 UTC on checkout day).
    const bookingIds = bookingsToComplete.map((b) => b.id);

    const result = await db.booking.updateMany({
      where: {
        id:     { in: bookingIds },
        status: "CONFIRMED", // guard: only complete still-confirmed bookings
      },
      data: { status: "COMPLETED" },
    });

    console.log(`[cron] mark-completed-stays: marked ${result.count} bookings as completed`);

    // ── Step 3: Notify each student ────────────────────────────────────────
    // Run all notifications concurrently. Promise.allSettled ensures a single
    // notification failure never prevents the others from being sent.
    // createNotification is already fire-and-forget internally (never throws),
    // but we add an extra .catch here for belt-and-suspenders logging.
    const notifications = await Promise.allSettled(
      bookingsToComplete.map((booking) =>
        createNotification({
          userId:   booking.userId,
          type:     "BOOKING_COMPLETED",
          title:    "Stay completed",
          message:  `Your stay at ${booking.hostel.name} is complete. Share your experience by leaving a review — it helps other students.`,
          bookingId: booking.id,
          hostelId:  booking.hostelId,
        }).catch((err) =>
          console.error(
            `[cron] mark-completed-stays: failed to notify user ${booking.userId} ` +
            `for booking ${booking.id}:`,
            err,
          ),
        ),
      ),
    );

    const notified  = notifications.filter((r) => r.status === "fulfilled").length;
    const nFailed   = notifications.filter((r) => r.status === "rejected").length;

    if (nFailed > 0) {
      console.warn(
        `[cron] mark-completed-stays: ${nFailed} notification(s) failed ` +
        `(see errors above)`,
      );
    }

    console.log(
      `[cron] mark-completed-stays: sent ${notified}/${bookingsToComplete.length} notifications`,
    );

    return NextResponse.json({
      message:   "Completed stays marked",
      count:     result.count,
      notified,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron] mark-completed-stays failed:", err);
    return NextResponse.json(
      {
        error:   "Cron job failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}