// Path: src/app/api/admin/listings/stats/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { computeListingCompleteness, FLAGGED_THRESHOLD } from "@/lib/listingCompleteness";
import { rateLimit } from "@/lib/rate-limit";

const NEWLY_PUBLISHED_WINDOW_DAYS = 7;
const COMPLETENESS_BATCH_SIZE = 200;

export async function GET() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const statsLimit = await rateLimit(`admin-listing-stats:${session.user.id}`, {
    limit: 10,
    windowMs: 60_000,
  });
  if (!statsLimit.ok) {
    return NextResponse.json(
      { error: "Too many listing statistics requests. Please slow down." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, Math.ceil((statsLimit.resetAt - Date.now()) / 1000))) },
      },
    );
  }

  const newlyPublishedSince = new Date(Date.now() - NEWLY_PUBLISHED_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [totalListings, pendingApproval, newlyPublished] = await Promise.all([
    db.hostel.count(),
    db.hostel.count({ where: { status: "PENDING_REVIEW" } }),
    db.hostel.count({ where: { status: "ACTIVE", updatedAt: { gte: newlyPublishedSince } } }),
  ]);

  // Completeness is scored in application code, so walk the pending queue in
  // stable, bounded batches instead of materializing the whole backlog.
  let flaggedCount = 0;
  let cursor: string | undefined;
  while (true) {
    const pendingBatch = await db.hostel.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { id: "asc" },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: COMPLETENESS_BATCH_SIZE,
      select: { id: true, images: true, description: true, amenities: true, rules: true },
    });
    flaggedCount += pendingBatch.filter(
      (hostel) => computeListingCompleteness(hostel).score < FLAGGED_THRESHOLD,
    ).length;
    if (pendingBatch.length < COMPLETENESS_BATCH_SIZE) break;
    cursor = pendingBatch[pendingBatch.length - 1].id;
  }

  return NextResponse.json({
    data: {
      totalListings,
      pendingApproval,
      flaggedCount,
      newlyPublished,
      newlyPublishedWindowDays: NEWLY_PUBLISHED_WINDOW_DAYS,
      flaggedThreshold: FLAGGED_THRESHOLD,
    },
  });
}
