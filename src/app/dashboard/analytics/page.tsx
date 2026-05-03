import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Analytics from "@/components/features/dashboard/analytics";
import { startOfMonth, subMonths } from "date-fns";

export const metadata = {
  title: "Analytics - Owner Dashboard",
  description: "View hostel performance analytics and statistics",
};

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "OWNER") {
    redirect("/login");
  }

  const userId = session.user.id;

  // Get 12 months of data
  const monthsBack = Array.from({ length: 12 }, (_, i) => 11 - i);
  const monthlyData = await Promise.all(
    monthsBack.map(async (i) => {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = startOfMonth(subMonths(new Date(), i - 1));

      const bookings = await db.booking.findMany({
        where: {
          hostel: { ownerId: userId },
          createdAt: { gte: monthStart, lt: monthEnd },
        },
        select: { total: true, status: true },
      });

      const revenue = bookings.reduce((sum, b) => sum + b.total, 0);

      return {
        month: monthStart.toLocaleDateString("en-US", { month: "short" }),
        revenue: Math.round(revenue / 100), // Convert from paise to PKR
        bookings: bookings.length,
      };
    })
  );

  // Get booking status breakdown
  const allBookings = await db.booking.findMany({
    where: { hostel: { ownerId: userId } },
    select: { status: true, total: true },
  });

  const statusBreakdown = {
    PENDING: allBookings.filter((b) => b.status === "PENDING").length,
    CONFIRMED: allBookings.filter((b) => b.status === "CONFIRMED").length,
    COMPLETED: allBookings.filter((b) => b.status === "COMPLETED").length,
    CANCELLED: allBookings.filter((b) => b.status === "CANCELLED").length,
  };

  // Get review distribution
  const reviews = await db.review.findMany({
    where: { hostel: { ownerId: userId } },
    select: { rating: true },
  });

  const reviewDistribution = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

  // Get total revenue
  const totalRevenue = allBookings.reduce(
    (sum, b) => sum + (b.status === "COMPLETED" ? b.total : 0),
    0
  );

  return (
    <main>
      <Analytics
        monthlyData={monthlyData}
        statusBreakdown={statusBreakdown}
        reviewDistribution={reviewDistribution}
        avgRating={parseFloat(avgRating as string)}
        totalRevenue={Math.round(totalRevenue / 100)}
        totalBookings={allBookings.length}
      />
    </main>
  );
}
