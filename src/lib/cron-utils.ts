// Path: src/lib/cron-utils.ts
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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
  handler: () => Promise<CronResult>,
): Promise<NextResponse> {
  const startedAt = Date.now();

  Sentry.addBreadcrumb({
    category: "cron",
    message:  `Starting ${name}`,
    level:    "info",
  });

  try {
    const result = await handler();
    const durationMs = Date.now() - startedAt;

    // Structured log — parsed by Axiom / Vercel log drain
    console.log(
      JSON.stringify({
        event:      "cron.success",
        cron:       name,
        durationMs,
        timestamp:  new Date().toISOString(),
        ...result,
      }),
    );

    // Record last successful run in KV (CronLog table) for health checks
    void recordCronRun(name, "success", durationMs).catch(() => {
      // Non-fatal — health check degrades gracefully without this
    });

    return NextResponse.json({
      ...result,
      durationMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    const message    = err instanceof Error ? err.message : String(err);

    console.error(
      JSON.stringify({
        event:      "cron.error",
        cron:       name,
        durationMs,
        timestamp:  new Date().toISOString(),
        error:      message,
      }),
    );

    // Capture in Sentry with cron name as tag for filtering
    Sentry.withScope((scope) => {
      scope.setTag("cron", name);
      scope.setExtra("durationMs", durationMs);
      Sentry.captureException(err);
    });

    void recordCronRun(name, "error", durationMs, message).catch(() => {});

    return NextResponse.json(
      { error: "Cron job failed", cron: name, details: message },
      { status: 500 },
    );
  }
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