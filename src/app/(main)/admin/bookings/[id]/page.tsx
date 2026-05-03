import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ChevronLeft, Home, User, Calendar, Users, DollarSign, FileText, CreditCard, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import styles from "./booking-detail.module.css";

export const metadata = {
  title: "Booking Details - Admin",
};

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = await params;

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      hostel: { select: { id: true, name: true, city: true, pricePerMonth: true } },
      user: { select: { id: true, name: true, email: true, phone: true } },
      room: { select: { id: true, name: true } },
    },
  });

  if (!booking) {
    return (
      <div className={styles.container}>
        <p>Booking not found</p>
      </div>
    );
  }

  const checkInDate = new Date(booking.checkIn);
  const checkOutDate = new Date(booking.checkOut);
  const days = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "warning";
      case "CONFIRMED":
        return "success";
      case "COMPLETED":
        return "primary";
      case "CANCELLED":
        return "danger";
      default:
        return "default";
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "success";
      case "PENDING":
        return "warning";
      case "REFUNDED":
        return "info";
      case "FAILED":
        return "danger";
      default:
        return "default";
    }
  };

  const statusColor = getStatusColor(booking.status);
  const paymentColor = getPaymentColor(booking.paymentStatus);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin/bookings" className={styles.backLink} aria-label="Go back to bookings list">
          <ChevronLeft size={20} />
          <span>Back to Bookings</span>
        </Link>
        <h1 className={styles.title}>Booking Details</h1>
      </div>

      <div className={styles.grid}>
        {/* Booking Information */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Booking Information</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label className={styles.label}>Booking ID</label>
              <p className={styles.value}>{booking.id}</p>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>Status</label>
              <span className={`${styles.badge} ${styles[`badge${statusColor.charAt(0).toUpperCase() + statusColor.slice(1)}`]}`}>
                {booking.status === "PENDING"
                  ? "Pending"
                  : booking.status === "CONFIRMED"
                    ? "Confirmed"
                    : booking.status === "COMPLETED"
                      ? "Completed"
                      : "Cancelled"}
              </span>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>Created</label>
              <p className={styles.value}>{new Date(booking.createdAt).toLocaleString()}</p>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>Last Updated</label>
              <p className={styles.value}>{new Date(booking.updatedAt).toLocaleString()}</p>
            </div>
          </div>
        </section>

        {/* Hostel Information */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Hostel Information</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label className={styles.label}>
                <Home size={16} /> Hostel Name
              </label>
              <Link href={`/admin/hostels/${booking.hostel.id}`} className={styles.link}>
                {booking.hostel.name}
              </Link>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>City</label>
              <p className={styles.value}>{booking.hostel.city}</p>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>Price per Month</label>
              <p className={styles.value}>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "PKR",
                  maximumFractionDigits: 0,
                }).format(booking.hostel.pricePerMonth)}
              </p>
            </div>
            {booking.room && (
              <div className={styles.infoItem}>
                <label className={styles.label}>Room</label>
                <p className={styles.value}>{booking.room.name}</p>
              </div>
            )}
          </div>
        </section>

        {/* Guest Information */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Guest Information</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label className={styles.label}>
                <User size={16} /> Guest Name
              </label>
              <Link href={`/admin/users/${booking.user.id}`} className={styles.link}>
                {booking.user.name}
              </Link>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>Email</label>
              <p className={styles.value}>{booking.user.email}</p>
            </div>
            {booking.user.phone && (
              <div className={styles.infoItem}>
                <label className={styles.label}>Phone</label>
                <p className={styles.value}>{booking.user.phone}</p>
              </div>
            )}
            <div className={styles.infoItem}>
              <label className={styles.label}>
                <Users size={16} /> Number of Guests
              </label>
              <p className={styles.value}>{booking.guests}</p>
            </div>
          </div>
        </section>

        {/* Stay Details */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Stay Details</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label className={styles.label}>
                <Calendar size={16} /> Check-in
              </label>
              <p className={styles.value}>
                {format(checkInDate, "MMM dd, yyyy")}
                <span className={styles.time}>{format(checkInDate, "hh:mm a")}</span>
              </p>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>
                <Calendar size={16} /> Check-out
              </label>
              <p className={styles.value}>
                {format(checkOutDate, "MMM dd, yyyy")}
                <span className={styles.time}>{format(checkOutDate, "hh:mm a")}</span>
              </p>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>Duration</label>
              <p className={styles.value}>
                {booking.months} month{booking.months > 1 ? "s" : ""} ({days} days)
              </p>
            </div>
          </div>
        </section>

        {/* Payment Information */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Payment Information</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label className={styles.label}>
                <DollarSign size={16} /> Total Amount
              </label>
              <p className={styles.value}>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "PKR",
                  maximumFractionDigits: 0,
                }).format(booking.total)}
              </p>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>Payment Status</label>
              <span className={`${styles.paymentBadge} ${styles[`payment${paymentColor.charAt(0).toUpperCase() + paymentColor.slice(1)}`]}`}>
                {booking.paymentStatus}
              </span>
            </div>
            {booking.paymentMethod && (
              <div className={styles.infoItem}>
                <label className={styles.label}>
                  <CreditCard size={16} /> Payment Method
                </label>
                <p className={styles.value}>{booking.paymentMethod}</p>
              </div>
            )}
            {booking.transactionId && (
              <div className={styles.infoItem}>
                <label className={styles.label}>Transaction ID</label>
                <p className={styles.value}>{booking.transactionId}</p>
              </div>
            )}
          </div>
        </section>

        {/* Additional Notes */}
        {booking.notes && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Additional Notes</h2>
            <div className={styles.infoItem}>
              <label className={styles.label}>
                <FileText size={16} /> Notes
              </label>
              <p className={styles.descriptionValue}>{booking.notes}</p>
            </div>
          </section>
        )}

        {/* Admin Actions */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Admin Actions</h2>
          <p className={styles.emptyNote}>Action buttons (Confirm, Cancel, Refund) will be implemented in the next iteration.</p>
        </section>
      </div>
    </div>
  );
}
