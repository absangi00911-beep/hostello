"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Booking, BookingStatus } from "@prisma/client";
import { format } from "date-fns";
import styles from "./booking-detail.module.css";

interface BookingDetailProps {
  booking: Booking & {
    hostel: { id: string; name: string; ownerId: string };
    user: { id: string; name: string; email: string; phone: string | null; avatar: string | null };
    room: { id: string; name: string } | null;
  };
}

export default function BookingDetail({ booking }: BookingDetailProps) {
  const router = useRouter();
  const [status, setStatus] = useState<BookingStatus>(booking.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleStatusChange = async (newStatus: BookingStatus) => {
    if (newStatus === status) return;

    // Map new status to existing action
    let action = "confirm";
    if (newStatus === "CANCELLED") action = "cancel";

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update booking");
        setLoading(false);
        return;
      }

      setStatus(newStatus);
      setSuccess(`Booking status updated to ${newStatus}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: "#f59e0b",
    CONFIRMED: "#10b981",
    COMPLETED: "#3b82f6",
    CANCELLED: "#ef4444",
  };

  const nights = Math.ceil(
    (new Date(booking.checkOut).getTime() -
      new Date(booking.checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          onClick={() => router.back()}
          className={styles.backButton}
        >
          ← Back
        </button>
        <h1 className={styles.title}>Booking Details</h1>
        <div />
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.grid}>
        {/* Booking Info */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Booking Information</h2>

          <div className={styles.infoGrid}>
            <div>
              <p className={styles.label}>Booking ID</p>
              <p className={styles.value}>{booking.id}</p>
            </div>
            <div>
              <p className={styles.label}>Status</p>
              <div
                className={styles.status}
                style={{ backgroundColor: statusColors[status] }}
              >
                {status}
              </div>
            </div>
            <div>
              <p className={styles.label}>Total Amount</p>
              <p className={styles.value}>PKR {booking.total.toLocaleString()}</p>
            </div>
            <div>
              <p className={styles.label}>Payment Status</p>
              <p
                className={`${styles.value} ${styles[booking.paymentStatus.toLowerCase()]}`}
              >
                {booking.paymentStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Stay Dates</h2>

          <div className={styles.infoGrid}>
            <div>
              <p className={styles.label}>Check-in</p>
              <p className={styles.value}>
                {format(new Date(booking.checkIn), "MMM dd, yyyy")}
              </p>
            </div>
            <div>
              <p className={styles.label}>Check-out</p>
              <p className={styles.value}>
                {format(new Date(booking.checkOut), "MMM dd, yyyy")}
              </p>
            </div>
            <div>
              <p className={styles.label}>Nights</p>
              <p className={styles.value}>{nights} night{nights !== 1 ? "s" : ""}</p>
            </div>
            <div>
              <p className={styles.label}>Guests</p>
              <p className={styles.value}>{booking.guests} guest{booking.guests !== 1 ? "s" : ""}</p>
            </div>
          </div>
        </div>

        {/* Hostel & Room */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Hostel & Room</h2>

          <div className={styles.infoGrid}>
            <div>
              <p className={styles.label}>Hostel</p>
              <p className={styles.value}>{booking.hostel.name}</p>
            </div>
            {booking.room && (
              <div>
                <p className={styles.label}>Room</p>
                <p className={styles.value}>{booking.room.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Guest Information */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Guest Information</h2>

          <div className={styles.guestCard}>
            {booking.user.avatar && (
              <img
                src={booking.user.avatar}
                alt={booking.user.name}
                className={styles.guestAvatar}
              />
            )}
            <div>
              <p className={styles.guestName}>{booking.user.name}</p>
              <p className={styles.guestEmail}>{booking.user.email}</p>
              {booking.user.phone && (
                <p className={styles.guestPhone}>{booking.user.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Payment Details</h2>

          <div className={styles.infoGrid}>
            <div>
              <p className={styles.label}>Payment Method</p>
              <p className={styles.value}>{booking.paymentMethod || "N/A"}</p>
            </div>
            {booking.transactionId && (
              <div>
                <p className={styles.label}>Transaction ID</p>
                <p className={styles.value}>{booking.transactionId}</p>
              </div>
            )}
          </div>
        </div>

        {/* Status Actions */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Update Status</h2>

          {status === "PENDING" ? (
            <div className={styles.actions}>
              <button
                onClick={() => handleStatusChange("CONFIRMED")}
                className={`${styles.button} ${styles.buttonSuccess}`}
                disabled={loading}
              >
                Confirm Booking
              </button>
              <button
                onClick={() => handleStatusChange("CANCELLED")}
                className={`${styles.button} ${styles.buttonDanger}`}
                disabled={loading}
              >
                Decline Booking
              </button>
            </div>
          ) : (
            <p className={styles.statusText}>
              This booking is {status.toLowerCase()} and cannot be modified.
            </p>
          )}
        </div>

        {/* Additional Notes */}
        {booking.notes && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Notes</h2>
            <p className={styles.notes}>{booking.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
