import { type NextRequest, NextResponse } from "next/server";
import { sweepCancelledRefunds } from "@/lib/refund-sweeper";
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
  return runCronJob("sweep-cancelled-refunds", async () => {
    const result = await sweepCancelledRefunds();
    return { message: "Cancelled refunds swept", ...result };
  }, logContext);
}
