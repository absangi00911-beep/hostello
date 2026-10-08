// Path: src/lib/cron-utils.ts
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { createOperationalLogContext, logOperationalEvent, type OperationalLogContext } from "@/lib/operational-logger";

export interface CronResult {
  /** Human-readable summary of what ran */
  message: string;
  /** Number of records affected */
  count?: number;
  /** Any extra structured data to include in the response */
  [key: string]: unknown;
}

/**
 * Wraps a cron handler function with:
 * - Execution timing
 * - Structured JSON logging (readable in Axiom / Vercel logs)
 * - Sentry breadcrumb + captureException on failure
 * - last-run timestamp written to DB so /api/health/crons can check it
 */
export async function runCronJob(
  name: string,
  handler: (logContext: OperationalLogContext) => Promise<CronResult>,
  logContext: OperationalLogContext = createOperationalLogContext(),
): Promise<NextResponse> {
  const startedAt = Date.now();

  Sentry.addBreadcrumb({
    category: "cron",
    message:  `Starting ${name}`,
    level:    "info",
  });

  try {
    const result = await handler(logContext);
    const durationMs = Date.now() - startedAt;

    logOperationalEvent("info", "cron.success", {
      cron: name,
      duration_ms: durationMs,
      ...toSafeLogAttributes(result),
    }, logContext);

    // Await the health write: fire-and-forget work may be stopped when the
    // serverless function returns, leaving /api/health/crons falsely stale.
    await persistCronRunSafely(name, "success", durationMs, undefined, logContext);

    return NextResponse.json({
      ...result,
      durationMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    const safeSummary = getSafeErrorSummary(err);

    logOperationalEvent("error", "cron.error", {
      cron: name,
      duration_ms: durationMs,
      error_name: safeSummary.name,
      ...(safeSummary.code ? { error_code: safeSummary.code } : {}),
      ...(safeSummary.status ? { error_status: safeSummary.status } : {}),
    }, logContext);

    // Capture in Sentry with cron name as tag for filtering
    Sentry.withScope((scope) => {
      scope.setTag("cron", name);
      scope.setExtra("durationMs", durationMs);
      scope.setExtra("requestId", logContext.request_id);
      if (logContext.trace_id) scope.setExtra("traceId", logContext.trace_id);
      Sentry.captureException(err);
    });

    await persistCronRunSafely(name, "error", durationMs, "Cron job failed", logContext);

    return NextResponse.json(
      { error: "Cron job failed", cron: name },
      { status: 500 },
    );
  }
}

async function persistCronRunSafely(
  name: string,
  status: "success" | "error",
  durationMs: number,
  error?: string,
  logContext?: OperationalLogContext,
) {
  try {
    await recordCronRun(name, status, durationMs, error);
  } catch (logError) {
    const summary = getSafeErrorSummary(logError);
    logOperationalEvent("error", "cron.health_log_failure", {
      cron: name,
      status,
      error_name: summary.name,
      ...(summary.code ? { error_code: summary.code } : {}),
      ...(summary.status ? { error_status: summary.status } : {}),
    }, logContext);
  }
}

function toSafeLogAttributes(result: CronResult): Record<string, string | number | boolean | null> {
  return Object.fromEntries(
    Object.entries(result).filter(([, value]) =>
      value === null || ["string", "number", "boolean"].includes(typeof value),
    ),
  ) as Record<string, string | number | boolean | null>;
}

/** Upserts a CronLog record so the health endpoint can verify recency */
async function recordCronRun(
  name:       string,
  status:     "success" | "error",
  durationMs: number,
  error?:     string,
) {
  await db.cronLog.upsert({
    where:  { name },
    update: { ranAt: new Date(), status, durationMs, error: error ?? null },
    create: { name,  ranAt: new Date(), status, durationMs, error: error ?? null },
  });
}
