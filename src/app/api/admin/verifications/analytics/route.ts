// Path: src/app/api/admin/verifications/analytics/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const VALID_RANGES = [7, 30, 90] as const;
const ANALYTICS_BATCH_SIZE = 200;

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (req.nextUrl.search.length > 1_024) {
    return NextResponse.json({ error: "Query is too long." }, { status: 400 });
  }

  const analyticsLimit = await rateLimit(`admin-verification-analytics:${session.user.id}`, {
    limit: 10,
    windowMs: 60_000,
  });
  if (!analyticsLimit.ok) {
    return NextResponse.json(
      { error: "Too many verification analytics requests. Please slow down." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, Math.ceil((analyticsLimit.resetAt - Date.now()) / 1000))) },
      },
    );
  }

  const daysParam = Number(req.nextUrl.searchParams.get("days") ?? 30);
  const days = (VALID_RANGES as readonly number[]).includes(daysParam) ? daysParam : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // The selected reporting window is date-bounded, but its row count still
  // grows with usage. Aggregate incrementally to cap memory per request.
  const pendingCount = await db.user.count({ where: { role: "STUDENT", verificationStatus: "PENDING" } });
  const byDay = new Map<string, { submissions: number; approvals: number }>();
  let submissionCursor: string | undefined;
  while (true) {
    const submittedBatch = await db.user.findMany({
      where: { role: "STUDENT", verificationSubmittedAt: { gte: since } },
      orderBy: [{ verificationSubmittedAt: "asc" }, { id: "asc" }],
      ...(submissionCursor ? { cursor: { id: submissionCursor }, skip: 1 } : {}),
      take: ANALYTICS_BATCH_SIZE,
      select: { id: true, verificationSubmittedAt: true },
    });

    for (const user of submittedBatch) {
      if (!user.verificationSubmittedAt) continue;
      const key = dayKey(user.verificationSubmittedAt);
      const entry = byDay.get(key) ?? { submissions: 0, approvals: 0 };
      entry.submissions += 1;
      byDay.set(key, entry);
    }

    if (submittedBatch.length < ANALYTICS_BATCH_SIZE) break;
    submissionCursor = submittedBatch[submittedBatch.length - 1].id;
  }

  let totalDecided = 0;
  let approvedCount = 0;
  let processingHoursTotal = 0;
  let processedDecisionCount = 0;
  const byModerator = new Map<string, {
    total: number;
    approved: number;
    hoursTotal: number;
    processedCount: number;
  }>();
  let decisionCursor: string | undefined;
  while (true) {
    const decidedBatch = await db.user.findMany({
      where: { role: "STUDENT", verificationDecidedAt: { gte: since } },
      orderBy: [{ verificationDecidedAt: "asc" }, { id: "asc" }],
      ...(decisionCursor ? { cursor: { id: decisionCursor }, skip: 1 } : {}),
      take: ANALYTICS_BATCH_SIZE,
      select: {
        id: true,
        verificationStatus: true,
        verificationSubmittedAt: true,
        verificationDecidedAt: true,
        verifiedById: true,
      },
    });

    for (const user of decidedBatch) {
      totalDecided += 1;
      if (user.verificationStatus === "APPROVED") {
        approvedCount += 1;
        if (user.verificationDecidedAt) {
          const key = dayKey(user.verificationDecidedAt);
          const entry = byDay.get(key) ?? { submissions: 0, approvals: 0 };
          entry.approvals += 1;
          byDay.set(key, entry);
        }
      }

      const processingHours = user.verificationSubmittedAt && user.verificationDecidedAt
        ? (user.verificationDecidedAt.getTime() - user.verificationSubmittedAt.getTime()) / 36e5
        : null;
      if (processingHours !== null) {
        processingHoursTotal += processingHours;
        processedDecisionCount += 1;
      }

      if (user.verifiedById) {
        const stats = byModerator.get(user.verifiedById) ?? {
          total: 0,
          approved: 0,
          hoursTotal: 0,
          processedCount: 0,
        };
        stats.total += 1;
        if (user.verificationStatus === "APPROVED") stats.approved += 1;
        if (processingHours !== null) {
          stats.hoursTotal += processingHours;
          stats.processedCount += 1;
        }
        byModerator.set(user.verifiedById, stats);
      }
    }

    if (decidedBatch.length < ANALYTICS_BATCH_SIZE) break;
    decisionCursor = decidedBatch[decidedBatch.length - 1].id;
  }

  const approvalRate = totalDecided > 0 ? (approvedCount / totalDecided) * 100 : null;
  const avgProcessingHours = processedDecisionCount > 0
    ? processingHoursTotal / processedDecisionCount
    : null;
  const moderatorIds = Array.from(byModerator.keys());

  // -- Throughput: submissions & approvals per day --------------
  const throughput = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  // -- Moderator performance ---------------------------------------
  const moderators = moderatorIds.length
    ? await db.user.findMany({ where: { id: { in: moderatorIds } }, select: { id: true, name: true } })
    : [];
  const moderatorPerformance = moderatorIds
    .map((id) => {
      const stats = byModerator.get(id)!;
      const avgHours = stats.processedCount > 0 ? stats.hoursTotal / stats.processedCount : null;
      return {
        id,
        name: moderators.find((m) => m.id === id)?.name ?? "Unknown",
        totalReviews: stats.total,
        approvalRate: (stats.approved / stats.total) * 100,
        avgHours,
      };
    })
    .sort((a, b) => b.totalReviews - a.totalReviews);

  return NextResponse.json({
    data: {
      days,
      pendingCount,
      totalDecided,
      approvalRate,
      avgProcessingHours,
      throughput,
      moderatorPerformance,
      // Decision-level analytics (everything except pendingCount and the
      // submissions half of the chart) are only accurate for verifications
      // decided on/after this date — verifiedById/verificationDecidedAt
      // didn't exist before it, so older decisions aren't attributed.
      trackingSince: "2026-08-14",
    },
  });
}
