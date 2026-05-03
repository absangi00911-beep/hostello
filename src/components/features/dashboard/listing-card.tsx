import Link from "next/link";
import { Hostel } from "@prisma/client";
import styles from "./listing-card.module.css";

interface ListingCardProps {
  hostel: Hostel;
  bookings: number;
  reviews: number;
}

const statusColors: Record<string, string> = {
  DRAFT: "#gray",
  PENDING_REVIEW: "#yellow",
  ACTIVE: "#green",
  SUSPENDED: "#red",
};

export default function ListingCard({
  hostel,
  bookings,
  reviews,
}: ListingCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{hostel.name}</h3>
        <span className={`${styles.status} ${styles[hostel.status.toLowerCase()]}`}>
          {hostel.status.replace("_", " ")}
        </span>
      </div>

      <div className={styles.details}>
        <p className={styles.location}>📍 {hostel.city}</p>
        <p className={styles.price}>PKR {hostel.pricePerMonth}/month</p>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <p className={styles.statValue}>{bookings}</p>
          <p className={styles.statLabel}>Bookings</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statValue}>{reviews}</p>
          <p className={styles.statLabel}>Reviews</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statValue}>{hostel.viewCount}</p>
          <p className={styles.statLabel}>Views</p>
        </div>
      </div>

      <div className={styles.actions}>
        <Link href={`/hostels/${hostel.slug}`} className={styles.viewLink}>
          View Public
        </Link>
        <Link href={`/dashboard/listings/${hostel.id}`} className={styles.editLink}>
          Manage
        </Link>
      </div>
    </div>
  );
}
