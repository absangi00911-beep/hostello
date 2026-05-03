import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Users, DollarSign, Calendar, Star, Eye } from "lucide-react";
import Link from "next/link";
import styles from "./hostel-detail.module.css";

export const metadata = {
  title: "Hostel Details - Admin",
};

interface HostelDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function HostelDetailPage({ params }: HostelDetailPageProps) {
  const { id } = await params;

  const hostel = await db.hostel.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true, phone: true } },
      bookings: { select: { status: true } },
    },
  });

  if (!hostel) {
    notFound();
  }

  const bookingStats = {
    total: hostel.bookings.length,
    pending: hostel.bookings.filter((b) => b.status === "PENDING").length,
    confirmed: hostel.bookings.filter((b) => b.status === "CONFIRMED").length,
    completed: hostel.bookings.filter((b) => b.status === "COMPLETED").length,
    cancelled: hostel.bookings.filter((b) => b.status === "CANCELLED").length,
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin/hostels" className={styles.backLink} aria-label="Go back to hostels list">
          <ChevronLeft size={20} />
          <span>Back to Hostels</span>
        </Link>
        <h1 className={styles.title}>{hostel.name}</h1>
      </div>

      <div className={styles.grid}>
        {/* Main Info */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Hostel Information</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label className={styles.label}>Name</label>
              <p className={styles.value}>{hostel.name}</p>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>Status</label>
              <span
                className={`${styles.badge} ${
                  hostel.status === "ACTIVE"
                    ? styles.badgeSuccess
                    : hostel.status === "PENDING_REVIEW"
                      ? styles.badgeWarning
                      : hostel.status === "SUSPENDED"
                        ? styles.badgeDanger
                        : styles.badgeDefault
                }`}
              >
                {hostel.status === "PENDING_REVIEW" ? "Pending Review" : hostel.status}
              </span>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>Slug</label>
              <p className={styles.value}>{hostel.slug}</p>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>Verified</label>
              <p className={styles.value}>{hostel.verified ? "✓ Yes" : "✗ No"}</p>
            </div>
            <div className={styles.fullWidth}>
              <label className={styles.label}>Description</label>
              <p className={styles.descriptionValue}>{hostel.description}</p>
            </div>
          </div>
        </section>

        {/* Location Info */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Location</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label className={styles.label}>
                <MapPin size={16} /> City
              </label>
              <p className={styles.value}>{hostel.city}</p>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>Area</label>
              <p className={styles.value}>{hostel.area || "Not specified"}</p>
            </div>
            <div className={styles.fullWidth}>
              <label className={styles.label}>Address</label>
              <p className={styles.value}>{hostel.address}</p>
            </div>
            {hostel.latitude && hostel.longitude && (
              <div className={styles.fullWidth}>
                <label className={styles.label}>Coordinates</label>
                <p className={styles.value}>
                  {hostel.latitude.toFixed(6)}, {hostel.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Pricing & Capacity */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Pricing & Capacity</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label className={styles.label}>
                <DollarSign size={16} /> Price per Month
              </label>
              <p className={styles.value}>PKR {hostel.pricePerMonth.toLocaleString()}</p>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>
                <Users size={16} /> Rooms
              </label>
              <p className={styles.value}>{hostel.rooms}</p>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>Total Capacity</label>
              <p className={styles.value}>{hostel.capacity} people</p>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>Gender Type</label>
              <p className={styles.value}>{hostel.gender}</p>
            </div>
          </div>
        </section>

        {/* Stay Duration */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Stay Duration</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label className={styles.label}>
                <Calendar size={16} /> Minimum Stay
              </label>
              <p className={styles.value}>{hostel.minStay} month(s)</p>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>Maximum Stay</label>
              <p className={styles.value}>{hostel.maxStay ? `${hostel.maxStay} month(s)` : "No limit"}</p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Statistics</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Eye size={20} />
              </div>
              <div>
                <p className={styles.statLabel}>Views</p>
                <p className={styles.statValue}>{hostel.viewCount.toLocaleString()}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Star size={20} />
              </div>
              <div>
                <p className={styles.statLabel}>Rating</p>
                <p className={styles.statValue}>{hostel.rating.toFixed(1)}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Star size={20} />
              </div>
              <div>
                <p className={styles.statLabel}>Reviews</p>
                <p className={styles.statValue}>{hostel.reviewCount}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Owner Info */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Owner Information</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label className={styles.label}>Name</label>
              <p className={styles.value}>{hostel.owner.name}</p>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>Email</label>
              <p className={styles.value}>{hostel.owner.email}</p>
            </div>
            {hostel.owner.phone && (
              <div className={styles.infoItem}>
                <label className={styles.label}>Phone</label>
                <p className={styles.value}>{hostel.owner.phone}</p>
              </div>
            )}
          </div>
        </section>

        {/* Booking Stats */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Bookings</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div>
                <p className={styles.statLabel}>Total</p>
                <p className={styles.statValue}>{bookingStats.total}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div>
                <p className={styles.statLabel}>Pending</p>
                <p className={styles.statValue}>{bookingStats.pending}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div>
                <p className={styles.statLabel}>Confirmed</p>
                <p className={styles.statValue}>{bookingStats.confirmed}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div>
                <p className={styles.statLabel}>Completed</p>
                <p className={styles.statValue}>{bookingStats.completed}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div>
                <p className={styles.statLabel}>Cancelled</p>
                <p className={styles.statValue}>{bookingStats.cancelled}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Amenities & Rules */}
        {hostel.amenities.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Amenities</h2>
            <div className={styles.tagsContainer}>
              {hostel.amenities.map((amenity) => (
                <span key={amenity} className={styles.tag}>
                  {amenity}
                </span>
              ))}
            </div>
          </section>
        )}

        {hostel.rules.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Rules</h2>
            <ul className={styles.rulesList}>
              {hostel.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Admin Actions */}
        {hostel.status === "PENDING_REVIEW" && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Admin Actions</h2>
            <p className={styles.emptyNote}>Action buttons (Approve, Reject, Suspend) will be implemented in the next iteration.</p>
          </section>
        )}
      </div>
    </div>
  );
}
