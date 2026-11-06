import { type NextRequest, NextResponse } from "next/server";
import { expireAvailabilityAlerts } from "@/lib/availability-alerts";
import { runCronJob } from "@/lib/cron-utils";
import { createOperationalLogContext } from "@/lib/operational-logger";
import { verifyUpstashRequest } from "@/lib/verify-upstash";

export async function POST(req: NextRequest) {
  try {
    await verifyUpstashRequest(req, { acceptBearerToken: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logContext = createOperationalLogContext(req);
  return runCronJob(
    "expire-availability-alerts",
    async () => {
      const expired = await expireAvailabilityAlerts();
      return {
        message: "Expired date-bound availability alerts",
        count: expired.count,
      };
    },
    logContext,
  );
}
