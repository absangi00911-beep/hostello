// Path: src/app/api/cron/cancel-abandoned-payments/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyUpstashRequest } from "@/lib/verify-upstash";
import { runCronJob } from "@/lib/cron-utils";
import { createOperationalLogContext } from "@/lib/operational-logger";

export const maxDuration = 60;
const BATCH_SIZE = 100;
const ABANDONED_AFTER_MS = 30 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    await verifyUpstashRequest(req, { acceptBearerToken: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logContext = createOperationalLogContext(req);
  return runCronJob("cancel-abandoned-payments", async () => {
    const olderThan = new Date(Date.now() - ABANDONED_AFTER_MS);
    let cancelled = 0;
    let roomsRestored = 0;

    while (true) {
      const candidates = await db.booking.findMany({
        where: {
          status: "PENDING",
          paymentStatus: "PENDING",
          createdAt: { lt: olderThan },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: BATCH_SIZE,
        select: { id: true, roomId: true, guests: true },
      });

      if (candidates.length === 0) break;

      // Recheck state in the update itself. A payment callback can win the race
      // after the read; in that case this booking must stay paid/confirmed and
      // its room must not be released by the cleanup job.
      const batchResult = await db.$transaction(async (tx) => {
        let batchCancelled = 0;
        let batchRoomsRestored = 0;

        for (const booking of candidates) {
          const result = await tx.booking.updateMany({
            where: {
              id: booking.id,
              status: "PENDING",
              paymentStatus: "PENDING",
              createdAt: { lt: olderThan },
            },
            data: { status: "CANCELLED", paymentStatus: "FAILED" },
          });

          if (result.count === 0) continue;
          batchCancelled += result.count;

          if (booking.roomId) {
            const roomResult = await tx.room.updateMany({
              where: { id: booking.roomId },
              data: { available: { increment: booking.guests }, version: { increment: 1 } },
            });
            batchRoomsRestored += roomResult.count;
          }
        }

        return { cancelled: batchCancelled, roomsRestored: batchRoomsRestored };
      });

      cancelled += batchResult.cancelled;
      roomsRestored += batchResult.roomsRestored;

      if (candidates.length < BATCH_SIZE) break;
    }

    return {
      message:       "Abandoned payments cancelled",
      count: cancelled,
      roomsRestored,
    };
  }, logContext);
}
