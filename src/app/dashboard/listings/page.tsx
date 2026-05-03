import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import Link from "next/link";
import styles from "./listings.module.css";
import ListingCard from "@/components/features/dashboard/listing-card";

export const metadata = {
  title: "Listings - Dashboard",
};

export default async function ListingsPage() {
  const session = await auth();
  const userId = session?.user?.id!;

  const hostels = await db.hostel.findMany({
    where: { ownerId: userId },
    include: {
      _count: {
        select: { bookings: true, reviews: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className={styles.listings}>
      <div className={styles.header}>
        <div>
          <h1>Your Listings</h1>
          <p className={styles.subtitle}>Manage and monitor your hostel listings</p>
        </div>
        <Link href="/dashboard/listings/new" className={styles.newBtn}>
          ➕ Add New Listing
        </Link>
      </div>

      {hostels.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>No listings yet</h2>
          <p>Create your first hostel listing to start accepting bookings</p>
          <Link href="/dashboard/listings/new" className={styles.createBtn}>
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div className={styles.listingsGrid}>
          {hostels.map((hostel) => (
            <ListingCard
              key={hostel.id}
              hostel={hostel}
              bookings={hostel._count.bookings}
              reviews={hostel._count.reviews}
            />
          ))}
        </div>
      )}
    </div>
  );
}
