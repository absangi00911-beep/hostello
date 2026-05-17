// Path: src/app/api/health/crons/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/config";

/**
 * GET /api/health/crons
 *
 * Returns the last run status of every cron job.
 * Used by Sentry Crons, uptime monitors, and the admin dashboard.
 *
 * Auth: Admin session or internal CRON_SECRET header required.
 *
 * Response:
 *   200 — all crons healthy
 *   207 — some crons degraded (ran but errored or ran too long ago)
 *   500 — DB unreachable
 */

const CRON_SCHEDULES: Record<string, { maxAgeMs: number; label: string }> = {
  "cancel-abandoned-payments": {
    maxAgeMs: 10 * 60 * 1000,        // expect every 5 min, alert if >10 min stale
    label:    "Cancel abandoned payments",
  },
  "check-price-alerts": {
    maxAgeMs: 8 * 60 * 60 * 1000,    // expect every 6 h, alert if >8 h stale
    label:    "Check price alerts",
  },
  "cleanup-tokens": {
    maxAgeMs: 26 * 60 * 60 * 1000,   // expect daily, alert if >26 h stale
    label:    "Cleanup expired tokens",
  },
  "mark-completed-stays": {
    maxAgeMs: 26 * 60 * 60 * 1000,   // expect daily at midnight UTC
    label:    "Mark completed stays",
  },
};

export async function GET(req: Request) {
  // Auth: admin session OR internal secret header
  const internalSecret = req.headers.get("x-cron-health-secret");
  const isInternal     = internalSecret === process.env.CRON_SECRET;

  if (!isInternal) {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = Date.now();

  let logs: { name: string; ranAt: Date; status: string; durationMs: number; error: string | null }[] = [];

  try {
    logs = await db.cronLog.findMany({
      select: { name: true, ranAt: true, status: true, durationMs: true, error: true },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Database unavailable", details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }

  const logByName = new Map(logs.map((l) => [l.name, l]));

  const checks = Object.entries(CRON_SCHEDULES).map(([name, schedule]) => {
    const log = logByName.get(name);

    if (!log) {
      return {
        name,
        label:   schedule.label,
        status:  "never_run" as const,
        healthy: false,
        ranAt:   null,
        ageMs:   null,
        error:   null,
      };
    }

    const ageMs   = now - log.ranAt.getTime();
    const stale   = ageMs > schedule.maxAgeMs;
    const errored = log.status === "error";
    const healthy = !stale && !errored;

    return {
      name,
      label:       schedule.label,
      status:      errored ? ("error" as const) : stale ? ("stale" as const) : ("ok" as const),
      healthy,
      ranAt:       log.ranAt.toISOString(),
      ageMs,
      durationMs:  log.durationMs,
      error:       log.error ?? null,
    };
  });

  const allHealthy    = checks.every((c) => c.healthy);
  const httpStatus    = allHealthy ? 200 : 207;
  const unhealthy     = checks.filter((c) => !c.healthy);

  return NextResponse.json(
    {
      healthy:   allHealthy,
      checkedAt: new Date().toISOString(),
      summary: {
        total:     checks.length,
        ok:        checks.filter((c) => c.status === "ok").length,
        stale:     checks.filter((c) => c.status === "stale").length,
        error:     checks.filter((c) => c.status === "error").length,
        never_run: checks.filter((c) => c.status === "never_run").length,
      },
      crons:     checks,
      ...(unhealthy.length > 0 && { unhealthy: unhealthy.map((c) => c.name) }),
    },
    { status: httpStatus },
  );
}