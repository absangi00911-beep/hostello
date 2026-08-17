// Path: src/app/api/admin/verifications/analytics/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

const VALID_RANGES = [7, 30, 90] as const;

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const daysParam = Number(req.nextUrl.searchParams.get("days") ?? 30);
  const days = (VALID_RANGES as readonly number[]).includes(daysParam) ? daysParam : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [pendingCount, submittedInRange, decidedInRange] = await Promise.all([
    // Live queue depth — not time-scoped, this is "how many need attention right now"
    db.user.count({ where: { verificationStatus: "PENDING" } }),

    // For the "Submissions" line of the throughput chart
    db.user.findMany({
      where: { verificationSubmittedAt: { gte: since } },
      select: { verificationSubmittedAt: true },
    }),

    // Everything else derives from this one set: total, approval rate,
    // avg processing time, the "Approvals" line, and moderator performance.
    // Only includes users decided *after* verifiedById/verificationDecidedAt
    // started being recorded — see the `trackingSince` note in the response.
    db.user.findMany({
      where: { verificationDecidedAt: { gte: since } },
      select: {
        verificationStatus: true,
        verificationSubmittedAt: true,
        verificationDecidedAt: true,
        verifiedById: true,
      },
    }),
  ]);

  // -- Throughput: submissions & approvals per day --------------
  const byDay = new Map<string, { submissions: number; approvals: number }>();
  for (const u of submittedInRange) {
    if (!u.verificationSubmittedAt) continue;
    const key = dayKey(u.verificationSubmittedAt);
    const entry = byDay.get(key) ?? { submissions: 0, approvals: 0 };
    entry.submissions += 1;
    byDay.set(key, entry);
  }
  for (const u of decidedInRange) {
    if (!u.verificationDecidedAt || u.verificationStatus !== "APPROVED") continue;
    const key = dayKey(u.verificationDecidedAt);
    const entry = byDay.get(key) ?? { submissions: 0, approvals: 0 };
    entry.approvals += 1;
    byDay.set(key, entry);
  }
  const throughput = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  // -- Top-level stats --------------------------------------------
  const totalDecided = decidedInRange.length;
  const approvedCount = decidedInRange.filter((u) => u.verificationStatus === "APPROVED").length;
  const approvalRate = totalDecided > 0 ? (approvedCount / totalDecided) * 100 : null;

  const processingHours = decidedInRange
    .filter((u) => u.verificationSubmittedAt && u.verificationDecidedAt)
    .map((u) => (u.verificationDecidedAt!.getTime() - u.verificationSubmittedAt!.getTime()) / 36e5);
  const avgProcessingHours =
    processingHours.length > 0
      ? processingHours.reduce((a, b) => a + b, 0) / processingHours.length
      : null;

  // -- Moderator performance ---------------------------------------
  const byModerator = new Map<string, { total: number; approved: number; hours: number[] }>();
  for (const u of decidedInRange) {
    if (!u.verifiedById) continue;
    const entry = byModerator.get(u.verifiedById) ?? { total: 0, approved: 0, hours: [] };
    entry.total += 1;
    if (u.verificationStatus === "APPROVED") entry.approved += 1;
    if (u.verificationSubmittedAt && u.verificationDecidedAt) {
      entry.hours.push((u.verificationDecidedAt.getTime() - u.verificationSubmittedAt.getTime()) / 36e5);
    }
    byModerator.set(u.verifiedById, entry);
  }
  const moderatorIds = Array.from(byModerator.keys());
  const moderators = moderatorIds.length
    ? await db.user.findMany({ where: { id: { in: moderatorIds } }, select: { id: true, name: true } })
    : [];
  const moderatorPerformance = moderatorIds
    .map((id) => {
      const stats = byModerator.get(id)!;
      const avgHours = stats.hours.length ? stats.hours.reduce((a, b) => a + b, 0) / stats.hours.length : null;
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
