import { type NextRequest, NextResponse } from "next/server";
import { runCronJob } from "@/lib/cron-utils";
import { verifyUpstashRequest } from "@/lib/verify-upstash";
import { deleteExpiredVerificationUploads } from "@/lib/verification-storage";
import { createOperationalLogContext } from "@/lib/operational-logger";

export async function POST(req: NextRequest) {
  try {
    await verifyUpstashRequest(req, { acceptBearerToken: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logContext = createOperationalLogContext(req);
  return runCronJob("cleanup-verification-uploads", async () => {
    const count = await deleteExpiredVerificationUploads();
    return { message: "Expired private verification uploads cleaned up", count };
  }, logContext);
}
