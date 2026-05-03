import { db } from "@/lib/db";
import Link from "next/link";
import { format } from "date-fns";
import styles from "./bookings.module.css";

export const metadata = {
  title: "Manage Bookings - Admin",
};

export default async function AdminBookingsPage() {
  const [totalBookings, pendingBookings, confirmedBookings, completedBookings, cancelledBookings, allBookings] = await Promise.all([
    db.booking.count(),
    db.booking.count({ where: { status: "PENDING" } }),
    db.booking.count({ where: { status: "CONFIRMED" } }),
    db.booking.count({ where: { status: "COMPLETED" } }),
    db.booking.count({ where: { status: "CANCELLED" } }),
    db.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        hostel: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Booking Management</h1>
        <p className={styles.subtitle}>Monitor and verify bookings across the platform</p>
      </div>

      {/* Booking Stats */}
      <section aria-label="Booking statistics">
        <div className={styles.statsGrid}>
          <div className={styles.statCard} aria-label={`Total Bookings: ${totalBookings}`}>
            <p className={styles.statLabel}>Total Bookings</p>
            <p className={styles.statValue}>{totalBookings}</p>
          </div>
          <div className={styles.statCard} aria-label={`Pending Bookings: ${pendingBookings}`}>
            <p className={styles.statLabel}>Pending</p>
            <p className={`${styles.statValue} ${styles.statValueWarning}`}>
              {pendingBookings}
            </p>
          </div>
          <div className={styles.statCard} aria-label={`Confirmed Bookings: ${confirmedBookings}`}>
            <p className={styles.statLabel}>Confirmed</p>
            <p className={`${styles.statValue} ${styles.statValueSuccess}`}>
              {confirmedBookings}
            </p>
          </div>
          <div className={styles.statCard} aria-label={`Completed Bookings: ${completedBookings}`}>
            <p className={styles.statLabel}>Completed</p>
            <p className={`${styles.statValue} ${styles.statValuePrimary}`}>
              {completedBookings}
            </p>
          </div>
          <div className={styles.statCard} aria-label={`Cancelled Bookings: ${cancelledBookings}`}>
            <p className={styles.statLabel}>Cancelled</p>
            <p className={`${styles.statValue} ${styles.statValueError}`}>
              {cancelledBookings}
            </p>
          </div>
        </div>
      </section>

      {/* Bookings Table */}
      <section className={styles.section}>
        <div className={styles.tableContainer}>
          <div className={styles.table} role="table" aria-label="All bookings table">
            <div className={styles.tableHeader} role="row">
              <div className={styles.colBooking} role="columnheader">Booking ID</div>
              <div className={styles.colGuest} role="columnheader">Guest</div>
              <div className={styles.colHostel} role="columnheader">Hostel</div>
              <div className={styles.colStatus} role="columnheader">Status</div>
              <div className={styles.colPayment} role="columnheader">Payment</div>
              <div className={styles.colTotal} role="columnheader">Amount</div>
              <div className={styles.colDates} role="columnheader">Check-in / Check-out</div>
              <div className={styles.colAction} role="columnheader">Action</div>
            </div>

            {allBookings.length === 0 ? (
              <div className={styles.emptyState} role="status">
                <h3>No Bookings Found</h3>
                <p>No bookings exist in the system yet. New bookings will appear here.</p>
              </div>
            ) : (
              allBookings.map((booking) => (
                <div key={booking.id} className={styles.tableRow} role="row">
                  <div className={styles.colBooking} role="cell">
                    <span className={styles.bookingId}>{booking.id.slice(0, 10)}</span>
                  </div>
                  <div className={styles.colGuest} role="cell">
                    <div className={styles.guestInfo}>
                      <p className={styles.guestName}>{booking.user.name}</p>
                      <p className={styles.guestEmail}>{booking.user.email}</p>
                    </div>
                  </div>
                  <div className={styles.colHostel} role="cell">{booking.hostel.name}</div>
                  <div className={styles.colStatus} role="cell">
                    <span
                      className={`${styles.statusBadge} ${
                        booking.status === "PENDING"
                          ? styles.statusPending
                          : booking.status === "CONFIRMED"
                            ? styles.statusConfirmed
                            : booking.status === "COMPLETED"
                              ? styles.statusCompleted
                              : styles.statusCancelled
                      }`}
                      aria-label={`Booking status: ${booking.status}`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <div className={styles.colPayment} role="cell">
                    <span
                      className={`${styles.paymentBadge} ${
                        booking.paymentStatus === "PAID" ? styles.paymentPaid : styles.paymentPending
                      }`}
                      aria-label={`Payment status: ${booking.paymentStatus}`}
                    >
                      {booking.paymentStatus}
                    </span>
                  </div>
                  <div className={styles.colTotal} role="cell">
                    <span className={styles.amount}>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "PKR",
                        maximumFractionDigits: 0,
                      }).format(booking.total)}
                    </span>
                  </div>
                  <div className={styles.colDates} role="cell">
                    <span className={styles.dates}>
                      {format(new Date(booking.checkIn), "MMM dd")} - {format(new Date(booking.checkOut), "MMM dd")}
                    </span>
                  </div>
                  <div className={styles.colAction} role="cell">
                    <Link href={`/admin/bookings/${booking.id}`} className={styles.actionLink} aria-label={`View booking details for ${booking.id.slice(0, 10)}`}>
                      View
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
