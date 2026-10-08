// Path: src/app/api/cron/check-price-alerts/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { checkPriceAlerts } from "@/lib/price-alerts";
import { verifyUpstashRequest } from "@/lib/verify-upstash";
import { runCronJob } from "@/lib/cron-utils";
import { createOperationalLogContext } from "@/lib/operational-logger";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    await verifyUpstashRequest(req, { acceptBearerToken: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logContext = createOperationalLogContext(req);
  return runCronJob("check-price-alerts", async (context) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hostello.pk";
    const result = await checkPriceAlerts(appUrl, context);
    return { message: "Price alerts checked", ...result };
  }, logContext);
}
