import { db } from "@/lib/db";
import Link from "next/link";
import { Users, Building2, BookOpen, TrendingUp, Clock, AlertCircle } from "lucide-react";
import styles from "./admin-overview.module.css";

export const metadata = {
  title: "Admin Dashboard - HostelLo",
};

export default async function AdminPage() {
  const [totalUsers, totalHostels, activeHostels, pendingHostels, totalBookings, pendingBookings, revenue, recentHostels, recentBookings] = await Promise.all([
    db.user.count(),
    db.hostel.count(),
    db.hostel.count({ where: { status: "ACTIVE" } }),
    db.hostel.count({ where: { status: "PENDING_REVIEW" } }),
    db.booking.count(),
    db.booking.count({ where: { status: "PENDING" } }),
    db.booking.aggregate({ where: { paymentStatus: "PAID" }, _sum: { total: true } }),
    db.hostel.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, city: true, createdAt: true, owner: { select: { name: true } } },
    }),
    db.booking.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { hostel: { select: { name: true } }, user: { select: { name: true } } },
    }),
  ]);

  const totalRevenue = revenue._sum.total ?? 0;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Admin Dashboard</h1>
      <p className={styles.subtitle}>System overview and pending actions</p>

      {/* Key Metrics */}
      <section aria-label="Key metrics">
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard} aria-label={`Total Users: ${totalUsers.toLocaleString()}`}>
            <div className={styles.metricIconPrimary} role="img" aria-label="Users icon">
              <Users size={24} />
            </div>
            <div>
              <p className={styles.metricLabel}>Total Users</p>
              <p className={styles.metricValue}>{totalUsers.toLocaleString()}</p>
            </div>
          </div>

          <div className={styles.metricCard} aria-label={`Active Hostels: ${activeHostels.toLocaleString()}`}>
            <div className={styles.metricIconSuccess} role="img" aria-label="Building icon">
              <Building2 size={24} />
            </div>
            <div>
              <p className={styles.metricLabel}>Active Hostels</p>
              <p className={styles.metricValue}>{activeHostels.toLocaleString()}</p>
            </div>
          </div>

          <div className={styles.metricCard} aria-label={`Pending Reviews: ${pendingHostels.toLocaleString()}`}>
            <div className={styles.metricIconError} role="img" aria-label="Alert icon">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className={styles.metricLabel}>Pending Reviews</p>
              <p className={styles.metricValue}>{pendingHostels.toLocaleString()}</p>
            </div>
          </div>

          <div className={styles.metricCard} aria-label={`Total Bookings: ${totalBookings.toLocaleString()}`}>
            <div className={styles.metricIconPurple} role="img" aria-label="Book icon">
              <BookOpen size={24} />
            </div>
            <div>
              <p className={styles.metricLabel}>Total Bookings</p>
              <p className={styles.metricValue}>{totalBookings.toLocaleString()}</p>
            </div>
          </div>

          <div className={styles.metricCard} aria-label={`Pending Bookings: ${pendingBookings.toLocaleString()}`}>
            <div className={styles.metricIconWarning} role="img" aria-label="Clock icon">
              <Clock size={24} />
            </div>
            <div>
              <p className={styles.metricLabel}>Pending Bookings</p>
              <p className={styles.metricValue}>{pendingBookings.toLocaleString()}</p>
            </div>
          </div>

          <div className={styles.metricCard} aria-label={`Total Revenue: PKR ${new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "PKR",
                maximumFractionDigits: 0,
              }).format(totalRevenue)}`}>
            <div className={styles.metricIconCyan} role="img" aria-label="Trending icon">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className={styles.metricLabel}>Total Revenue</p>
              <p className={styles.metricValue}>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "PKR",
                  maximumFractionDigits: 0,
                }).format(totalRevenue)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pending Hostels */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Pending Hostel Reviews</h2>
          <Link href="/admin/hostels" className={styles.viewAllLink}>
            View All →
          </Link>
        </div>

        {recentHostels.length === 0 ? (
          <div className={styles.emptyState} role="status">
            <h3>No Pending Reviews</h3>
            <p>All hostels have been reviewed. New submissions will appear here.</p>
          </div>
        ) : (
          <div className={styles.table} role="table" aria-label="Pending hostel reviews table">
            <div className={styles.tableHeader} role="row">
              <div className={styles.tableCell} role="columnheader">Hostel Name</div>
              <div className={styles.tableCell} role="columnheader">Owner</div>
              <div className={styles.tableCell} role="columnheader">City</div>
              <div className={styles.tableCell} role="columnheader">Submitted</div>
              <div className={styles.tableCell} role="columnheader">Action</div>
            </div>
            {recentHostels.map((hostel) => (
              <div key={hostel.id} className={styles.tableRow} role="row">
                <div className={styles.tableCell} role="cell">{hostel.name}</div>
                <div className={styles.tableCell} role="cell">{hostel.owner.name}</div>
                <div className={styles.tableCell} role="cell">{hostel.city}</div>
                <div className={styles.tableCell} role="cell">
                  {new Date(hostel.createdAt).toLocaleDateString()}
                </div>
                <div className={styles.tableCell} role="cell">
                  <Link href={`/admin/hostels/${hostel.id}`} className={styles.actionButton} aria-label={`Review ${hostel.name}`}>
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending Bookings */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Pending Bookings</h2>
          <Link href="/admin/bookings" className={styles.viewAllLink}>
            View All →
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className={styles.emptyState} role="status">
            <h3>No Pending Bookings</h3>
            <p>All bookings have been confirmed. New pending bookings will appear here.</p>
          </div>
        ) : (
          <div className={styles.table} role="table" aria-label="Pending bookings table">
            <div className={styles.tableHeader} role="row">
              <div className={styles.tableCell} role="columnheader">Booking ID</div>
              <div className={styles.tableCell} role="columnheader">Hostel</div>
              <div className={styles.tableCell} role="columnheader">Guest</div>
              <div className={styles.tableCell} role="columnheader">Status</div>
              <div className={styles.tableCell} role="columnheader">Date</div>
            </div>
            {recentBookings.map((booking) => (
              <div key={booking.id} className={styles.tableRow} role="row">
                <div className={styles.tableCell} role="cell">{booking.id.slice(0, 8)}</div>
                <div className={styles.tableCell} role="cell">{booking.hostel.name}</div>
                <div className={styles.tableCell} role="cell">{booking.user.name}</div>
                <div className={styles.tableCell} role="cell">
                  <span className={`${styles.badge} ${styles.badgePending}`} aria-label={`Status: ${booking.status}`}>{booking.status}</span>
                </div>
                <div className={styles.tableCell} role="cell">
                  {new Date(booking.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
