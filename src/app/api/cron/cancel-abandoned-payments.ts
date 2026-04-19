import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Cron job to cancel bookings stuck in PENDING payment status.
 * 
 * Bookings created but payment never initiated or abandoned after 30 minutes
 * should be cancelled to free up hostel capacity.
 * 
 * Trigger: Via Upstash QStash or Vercel Cron every 5 minutes
 * Endpoint: POST /api/cron/cancel-abandoned-payments
 * 
 * Required env vars:
 *   CRON_SECRET - to verify requests (set same value in QStash/Vercel)
 */

export const maxDuration = 60; // 60 seconds for serverless timeout

export async function POST(req: NextRequest) {
  try {
    // Verify request is from trusted cron source
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[cron] Unauthorized cancel-abandoned-payments request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    // Find PENDING bookings that were created 30+ minutes ago
    // (payment was initiated but never completed or payment webhook never arrived)
    const abandoned = await db.booking.updateMany({
      where: {
        status: "PENDING",
        paymentStatus: "PENDING",
        createdAt: { lt: thirtyMinutesAgo },
      },
      data: {
        status: "CANCELLED",
        paymentStatus: "FAILED",
      },
    });

    console.error(`[cron] Cancelled ${abandoned.count} abandoned payment bookings`);

    return NextResponse.json({
      message: "Abandoned payments cancelled",
      count: abandoned.count,
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
