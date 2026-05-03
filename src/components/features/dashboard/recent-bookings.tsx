import styles from "./recent-bookings.module.css";
import { Booking, User, Hostel } from "@prisma/client";

interface RecentBookingsProps {
  bookings: (Booking & { user: { name: string; email: string }; hostel: { name: string } })[];
}

export default function RecentBookings({ bookings }: RecentBookingsProps) {
  if (!bookings || bookings.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No bookings yet. Create a listing to start accepting bookings!</p>
      </div>
    );
  }

  return (
    <div className={styles.bookingsList}>
      {bookings.map((booking) => (
        <div key={booking.id} className={styles.bookingItem}>
          <div className={styles.bookingInfo}>
            <p className={styles.guestName}>{booking.user.name}</p>
            <p className={styles.hostelName}>{booking.hostel.name}</p>
            <p className={styles.dates}>
              {new Date(booking.checkIn).toLocaleDateString()} -
              {new Date(booking.checkOut).toLocaleDateString()}
            </p>
          </div>
          <div className={styles.bookingMeta}>
            <span className={`${styles.status} ${styles[booking.status.toLowerCase()]}`}>
              {booking.status}
            </span>
            <p className={styles.amount}>
              PKR {(booking.total / 100).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
