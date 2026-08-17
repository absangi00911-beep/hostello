// Path: src/app/api/admin/listings/stats/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { computeListingCompleteness, FLAGGED_THRESHOLD } from "@/lib/listingCompleteness";

const NEWLY_PUBLISHED_WINDOW_DAYS = 7;

export async function GET() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const newlyPublishedSince = new Date(Date.now() - NEWLY_PUBLISHED_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [totalListings, pendingApproval, newlyPublished, pendingHostels] = await Promise.all([
    db.hostel.count(),
    db.hostel.count({ where: { status: "PENDING_REVIEW" } }),
    db.hostel.count({ where: { status: "ACTIVE", updatedAt: { gte: newlyPublishedSince } } }),
    // Need full content to score completeness — only pulling the
    // (bounded) pending queue, not the whole table.
    db.hostel.findMany({
      where: { status: "PENDING_REVIEW" },
      select: { images: true, description: true, amenities: true, rules: true },
    }),
  ]);

  const flaggedCount = pendingHostels.filter(
    (h) => computeListingCompleteness(h).score < FLAGGED_THRESHOLD
  ).length;

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
