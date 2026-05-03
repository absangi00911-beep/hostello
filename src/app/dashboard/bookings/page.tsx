import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import Link from "next/link";
import styles from "./bookings.module.css";
import BookingTable from "@/components/features/dashboard/booking-table";

export const metadata = {
  title: "Bookings - Dashboard",
};

export default async function BookingsPage() {
  const session = await auth();
  const userId = session?.user?.id!;

  const bookings = await db.booking.findMany({
    where: { hostel: { ownerId: userId } },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      hostel: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "PENDING").length,
    confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
    completed: bookings.filter((b) => b.status === "COMPLETED").length,
    cancelled: bookings.filter((b) => b.status === "CANCELLED").length,
  };

  return (
    <div className={styles.bookings}>
      <div className={styles.header}>
        <div>
          <h1>Bookings & Reservations</h1>
          <p className={styles.subtitle}>Manage guest bookings and reservations</p>
        </div>
      </div>

      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total</span>
          <span className={styles.statValue}>{stats.total}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Pending</span>
          <span className={`${styles.statValue} ${styles.pending}`}>{stats.pending}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Confirmed</span>
          <span className={`${styles.statValue} ${styles.confirmed}`}>{stats.confirmed}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Completed</span>
          <span className={`${styles.statValue} ${styles.completed}`}>{stats.completed}</span>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>No bookings yet</h2>
          <p>Your bookings will appear here once guests reserve your hostel</p>
          <Link href="/dashboard/listings" className={styles.createBtn}>
            Create a Listing
          </Link>
        </div>
      ) : (
        <BookingTable bookings={bookings} />
      )}
    </div>
  );
}
