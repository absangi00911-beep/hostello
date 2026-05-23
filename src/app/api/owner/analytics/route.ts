import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ownerId = session.user.id;

  // 1. All owner hostels
  const hostels = await db.hostel.findMany({
    where: { ownerId },
    select: { id: true, viewCount: true },
  });
  const hostelIds = hostels.map((h) => h.id);
  const totalViews = hostels.reduce((sum, h) => sum + h.viewCount, 0);

  if (hostelIds.length === 0) {
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
    where: { hostelId: { in: hostelIds } },
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
    where: { hostelId: { in: hostelIds }, paymentStatus: "PAID" },
    _sum: { total: true },
  });
  const totalRevenue = revenueAgg._sum.total ?? 0;

  // 4. Bookings by month — last 6 months
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const recentBookings = await db.booking.findMany({
    where: { hostelId: { in: hostelIds }, createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true, total: true, paymentStatus: true },
  });

  // Build ordered month slots
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const slots = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()], bookings: 0, revenue: 0 };
  });
  const slotMap = new Map(slots.map((s) => [s.key, s]));

  for (const b of recentBookings) {
    const d = new Date(b.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const slot = slotMap.get(key);
    if (slot) {
      slot.bookings += 1;
      if (b.paymentStatus === "PAID") slot.revenue += b.total;
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
