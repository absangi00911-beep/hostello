import { type NextRequest, NextResponse } from "next/server";
import { runCronJob } from "@/lib/cron-utils";
import { verifyUpstashRequest } from "@/lib/verify-upstash";
import { deleteExpiredVerificationUploads } from "@/lib/verification-storage";
import { expireStalePendingVerifications, sweepOrphanedVerificationDocuments } from "@/lib/verification-retention";
import { createOperationalLogContext, logOperationalEvent } from "@/lib/operational-logger";
import { getSafeErrorSummary } from "@/lib/safe-error";

export async function POST(req: NextRequest) {
  try {
    await verifyUpstashRequest(req, { acceptBearerToken: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logContext = createOperationalLogContext(req);
  return runCronJob("cleanup-verification-uploads", async () => {
    // Three independent jobs on one schedule. A failure in one must not stop the others,
    // but it must still fail the run so /api/health/crons reports it.
    const steps = {
      abandonedUploads: deleteExpiredVerificationUploads,
      orphanedDocuments: sweepOrphanedVerificationDocuments,
      expiredPending: expireStalePendingVerifications,
    };
    const counts: Record<string, number> = {};
    const failures: string[] = [];

    for (const [name, step] of Object.entries(steps)) {
      try {
        counts[name] = await step();
      } catch (error) {
        failures.push(name);
        logOperationalEvent("error", "verification.cleanup_step_failed", {
          step: name,
          error_name: getSafeErrorSummary(error).name,
        }, logContext);
      }
    }
    if (failures.length > 0) {
      throw new Error(`Verification cleanup steps failed: ${failures.join(", ")}`);
    }

    const count = Object.values(counts).reduce((total, value) => total + value, 0);
    return { message: "Verification uploads, orphaned documents and stale requests cleaned up", count, ...counts };
  }, logContext);
}
