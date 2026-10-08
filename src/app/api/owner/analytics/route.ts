import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const analyticsLimit = await rateLimit(`owner-analytics:${session.user.id}`, {
    limit: 10,
    windowMs: 60_000,
  });
  if (!analyticsLimit.ok) {
    return NextResponse.json(
      { error: "Too many analytics requests. Please slow down." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, Math.ceil((analyticsLimit.resetAt - Date.now()) / 1000))) },
      },
    );
  }

  const ownerId = session.user.id;

  // Aggregate owner listing metrics without loading every hostel into memory.
  const hostelSummary = await db.hostel.aggregate({
    where: { ownerId },
    _count: { _all: true },
    _sum: { viewCount: true },
  });
  const totalViews = hostelSummary._sum.viewCount ?? 0;

  if (hostelSummary._count._all === 0) {
    return NextResponse.json({
      totalViews: 0,
      totalRequests: 0,
      confirmedBookings: 0,
      conversionRate: 0,
      totalRevenue: 0,
      byMonth: [],
    });
  }

  // 2. Booking counts by status
  const statusGroups = await db.booking.groupBy({
    by: ["status"],
    where: { hostel: { is: { ownerId } } },
    _count: { id: true },
  });
  const countByStatus = Object.fromEntries(
    statusGroups.map((g) => [g.status, g._count.id])
  );
  const totalRequests = Object.values(countByStatus).reduce((a, b) => a + b, 0);
  const confirmedBookings = (countByStatus["CONFIRMED"] ?? 0) + (countByStatus["COMPLETED"] ?? 0);
  const conversionRate = totalRequests > 0
    ? Math.round((confirmedBookings / totalRequests) * 1000) / 10
    : 0;

  // 3. Revenue from paid bookings
  const revenueAgg = await db.booking.aggregate({
    where: { hostel: { is: { ownerId } }, paymentStatus: "PAID" },
    _sum: { total: true },
  });
  const totalRevenue = revenueAgg._sum.total ?? 0;

  // 4. Bookings by month — aggregate in PostgreSQL to bound transfer and app memory.
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // Build ordered month slots
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const slots = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: MONTHS[d.getMonth()],
      bookings: 0,
      revenue: 0,
    };
  });
  const slotMap = new Map(slots.map((s) => [s.key, s]));

  const monthlyAggregates = await db.$queryRaw<Array<{
    month: string;
    bookings: string;
    revenue: string;
  }>>`
    SELECT
      TO_CHAR(DATE_TRUNC('month', b."createdAt"), 'YYYY-MM') AS month,
      COUNT(*)::text AS bookings,
      COALESCE(SUM(CASE WHEN b."paymentStatus" = 'PAID' THEN b.total ELSE 0 END), 0)::text AS revenue
    FROM bookings AS b
    INNER JOIN hostels AS h ON h.id = b."hostelId"
    WHERE h."ownerId" = ${ownerId}
      AND b."createdAt" >= ${sixMonthsAgo}
    GROUP BY DATE_TRUNC('month', b."createdAt")
  `;

  for (const aggregate of monthlyAggregates) {
    const slot = slotMap.get(aggregate.month);
    if (slot) {
      slot.bookings = Number(aggregate.bookings);
      slot.revenue = Number(aggregate.revenue);
    }
  }

  return NextResponse.json({
    totalViews,
    totalRequests,
    confirmedBookings,
    conversionRate,
    totalRevenue,
    byMonth: slots,
  });
}
