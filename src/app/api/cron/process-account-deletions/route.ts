import { type NextRequest, NextResponse } from "next/server";
import { processAccountDeletionQueue } from "@/lib/account-deletion";
import { createOperationalLogContext } from "@/lib/operational-logger";
import { runCronJob } from "@/lib/cron-utils";
import { verifyUpstashRequest } from "@/lib/verify-upstash";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    await verifyUpstashRequest(req, { acceptBearerToken: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logContext = createOperationalLogContext(req);
  return runCronJob("process-account-deletions", processAccountDeletionQueue, logContext);
}
