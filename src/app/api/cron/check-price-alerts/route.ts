import { type NextRequest, NextResponse } from "next/server";
import { checkPriceAlerts } from "@/lib/price-alerts";
import { verifyUpstashRequest } from "@/lib/verify-upstash";

/**
 * Cron endpoint for checking price alerts
 * Triggered by Upstash QStash every 6 hours
 */
export async function POST(req: NextRequest) {
  try {
    // Verify request is from Upstash or authorized source
    try {
      await verifyUpstashRequest(req, { acceptBearerToken: true });
    } catch (error) {
      console.warn(
        "[cron] Unauthorized check-price-alerts request:",
        error instanceof Error ? error.message : String(error)
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appUrl = process.env.APP_URL || "https://hostello.pk";
    const result = await checkPriceAlerts(appUrl);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[Cron] Price alert check failed:", err);
    return NextResponse.json(
      {
        error: "Cron job failed",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
