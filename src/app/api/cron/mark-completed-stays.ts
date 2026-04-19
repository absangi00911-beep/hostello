import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Cron job to transition CONFIRMED bookings to COMPLETED after checkout date.
 * 
 * This enables the review system — users can only review after a stay is marked COMPLETED.
 * 
 * Trigger: Via Vercel Cron once daily at midnight UTC
 * Endpoint: POST /api/cron/mark-completed-stays
 * 
 * Required env vars:
 *   CRON_SECRET - to verify requests
 */

export const maxDuration = 60; // 60 seconds for serverless timeout

export async function POST(req: NextRequest) {
  try {
    // Verify request is from trusted cron source
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[cron] Unauthorized mark-completed-stays request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    
    // Find all CONFIRMED bookings where checkOut date has passed
    const completed = await db.booking.updateMany({
      where: {
        status: "CONFIRMED",
        checkOut: { lt: now },
      },
      data: {
        status: "COMPLETED",
      },
    });

    console.log(`[cron] Marked ${completed.count} bookings as completed`);

    return NextResponse.json({
      message: "Completed stays marked",
      count: completed.count,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron] mark-completed-stays failed:", err);
    return NextResponse.json(
      { error: "Cron job failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
