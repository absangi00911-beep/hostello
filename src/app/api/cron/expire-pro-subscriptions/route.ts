import { type NextRequest, NextResponse } from "next/server";
import { verifyUpstashRequest } from "@/lib/verify-upstash";
import { runCronJob } from "@/lib/cron-utils";
import { createOperationalLogContext } from "@/lib/operational-logger";
import { expireProSubscriptions } from "@/lib/pro-subscription";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    await verifyUpstashRequest(req, { acceptBearerToken: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runCronJob(
    "expire-pro-subscriptions",
    async () => ({
      message: "Expired Pro subscriptions past their grace window",
      count: await expireProSubscriptions(),
    }),
    createOperationalLogContext(req),
  );
}
