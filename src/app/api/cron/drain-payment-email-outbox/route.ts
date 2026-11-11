import { type NextRequest, NextResponse } from "next/server";
import { drainPaymentEmailOutbox } from "@/lib/payment-email-outbox";
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
  return runCronJob("drain-payment-email-outbox", async () => ({
    message: "Payment email outbox drained",
    ...await drainPaymentEmailOutbox(),
  }), logContext);
}
