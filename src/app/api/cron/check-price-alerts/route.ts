import { type NextRequest, NextResponse } from "next/server";
import { checkPriceAlerts } from "@/scripts/check-price-alerts";

/**
 * Cron endpoint for checking price alerts
 * Triggered by Upstash QStash every 6 hours
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await checkPriceAlerts();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[Cron] Price alert check failed:", err);
    return NextResponse.json(
      { error: "Cron job failed", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
