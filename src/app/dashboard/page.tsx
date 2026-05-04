import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import Link from "next/link";
import styles from "./dashboard-overview.module.css";
import StatCard from "@/components/features/dashboard/stat-card";
import RecentBookings from "@/components/features/dashboard/recent-bookings";
import RecentReviews from "@/components/features/dashboard/recent-reviews";

export const metadata = {
  title: "Dashboard Overview - HostelLo",
};

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id!;

  // Fetch owner's hostels
  const hostels = await db.hostel.findMany({
    where: { ownerId: userId },
    select: { id: true, name: true, slug: true },
  });

  // Fetch stats
  const bookingStats = await db.booking.groupBy({
    by: ["status"],
    where: {
      hostel: { ownerId: userId },
    },
    _count: true,
  });

  const totalBookings = await db.booking.count({
    where: { hostel: { ownerId: userId } },
  });

  const pendingBookings = bookingStats.find((s) => s.status === "PENDING")?._count || 0;
  const confirmedBookings = bookingStats.find((s) => s.status === "CONFIRMED")?._count || 0;

  // Calculate total revenue from paid bookings
  const revenue = await db.booking.aggregate({
    where: {
      hostel: { ownerId: userId },
      paymentStatus: "PAID",
    },
    _sum: {
      total: true,
    },
  });

  const totalRevenue = revenue._sum.total || 0;

  // Fetch recent bookings
  const recentBookings = await db.booking.findMany({
    where: { hostel: { ownerId: userId } },
    include: {
      user: { select: { name: true, email: true } },
      hostel: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Fetch recent reviews
  const recentReviews = await db.review.findMany({
    where: { hostel: { ownerId: userId } },
    include: {
      user: { select: { name: true, avatar: true } },
      hostel: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className={styles.overview}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Welcome back, {session?.user?.name}! 👋</h1>
          <p className={styles.subtitle}>Here's what's happening with your hostels</p>
        </div>
      </header>

      <section className={styles.statsGrid}>
        <StatCard
          title="Active Listings"
          value={hostels.length}
          subtitle="Hostels listed"
          icon="🏢"
          link="/dashboard/listings"
        />
        <StatCard
          title="Total Bookings"
          value={totalBookings}
          subtitle="All time bookings"
          icon="📅"
          link="/dashboard/bookings"
        />
        <StatCard
          title="Pending Approval"
          value={pendingBookings}
          subtitle="Awaiting your response"
          icon="⏳"
          link="/dashboard/bookings"
        />
        <StatCard
          title="Total Revenue"
          value={`PKR ${totalRevenue.toLocaleString()}`}
          subtitle="From confirmed bookings"
          icon="💰"
        />
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Recent Bookings</h2>
            <Link href="/dashboard/bookings" className={styles.viewAll}>
              View All →
            </Link>
          </div>
          <RecentBookings bookings={recentBookings} />
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Recent Reviews</h2>
            <Link href="/dashboard/listings" className={styles.viewAll}>
              View All →
            </Link>
          </div>
          <RecentReviews reviews={recentReviews} />
        </div>
      </section>

      {hostels.length === 0 && (
        <div className={styles.emptyState}>
          <h2>No hostels yet</h2>
          <p>Create your first listing to start accepting bookings</p>
          <Link href="/dashboard/listings/new" className={styles.createBtn}>
            Create First Listing
          </Link>
        </div>
      )}
    </div>
  );
}
