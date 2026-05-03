import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ChevronLeft, Mail, Phone, MapPin, FileText, Calendar, Home, BookOpen, Star, MessageSquare } from "lucide-react";
import Link from "next/link";
import styles from "./user-detail.module.css";

export const metadata = {
  title: "User Details - Admin",
};

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          hostels: true,
          bookings: true,
          reviews: true,
          messages: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const isOwner = user.role === "OWNER";
  const emailVerificationStatus = user.emailVerified ? "Verified" : "Not Verified";
  const phoneVerificationStatus = user.phoneVerified ? "Verified" : "Not Verified";

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin/users" className={styles.backLink} aria-label="Go back to users list">
          <ChevronLeft size={20} />
          <span>Back to Users</span>
        </Link>
        <h1 className={styles.title}>{user.name}</h1>
      </div>

      <div className={styles.grid}>
        {/* Basic Info */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>User Information</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label className={styles.label}>Name</label>
              <p className={styles.value}>{user.name}</p>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>Role</label>
              <span className={`${styles.badge} ${styles[`badge${user.role}`]}`}>
                {user.role}
              </span>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>Account Status</label>
              <span className={styles.badge} style={{ background: "rgba(34, 197, 94, 0.1)", color: "var(--color-success)" }}>
                Active
              </span>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>Member Since</label>
              <p className={styles.value}>{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Contact Information</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label className={styles.label}>
                <Mail size={16} /> Email
              </label>
              <p className={styles.value}>{user.email}</p>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>Email Status</label>
              <span
                className={`${styles.verificationBadge} ${
                  user.emailVerified ? styles.verified : styles.unverified
                }`}
              >
                {emailVerificationStatus}
              </span>
            </div>
            {user.phone && (
              <>
                <div className={styles.infoItem}>
                  <label className={styles.label}>
                    <Phone size={16} /> Phone
                  </label>
                  <p className={styles.value}>{user.phone}</p>
                </div>
                <div className={styles.infoItem}>
                  <label className={styles.label}>Phone Status</label>
                  <span
                    className={`${styles.verificationBadge} ${
                      user.phoneVerified ? styles.verified : styles.unverified
                    }`}
                  >
                    {phoneVerificationStatus}
                  </span>
                </div>
              </>
            )}
            {user.city && (
              <div className={styles.infoItem}>
                <label className={styles.label}>
                  <MapPin size={16} /> City
                </label>
                <p className={styles.value}>{user.city}</p>
              </div>
            )}
          </div>
        </section>

        {/* Bio & Profile */}
        {user.bio && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Bio</h2>
            <div className={styles.infoItem}>
              <label className={styles.label}>
                <FileText size={16} /> About
              </label>
              <p className={styles.descriptionValue}>{user.bio}</p>
            </div>
          </section>
        )}

        {/* Statistics */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Activity Summary</h2>
          <div className={styles.statsGrid}>
            {isOwner && (
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <Home size={20} />
                </div>
                <div>
                  <p className={styles.statLabel}>Hostels Created</p>
                  <p className={styles.statValue}>{user._count.hostels}</p>
                </div>
              </div>
            )}
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <BookOpen size={20} />
              </div>
              <div>
                <p className={styles.statLabel}>{isOwner ? "Bookings Received" : "Bookings Made"}</p>
                <p className={styles.statValue}>{user._count.bookings}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Star size={20} />
              </div>
              <div>
                <p className={styles.statLabel}>Reviews Written</p>
                <p className={styles.statValue}>{user._count.reviews}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <MessageSquare size={20} />
              </div>
              <div>
                <p className={styles.statLabel}>Messages Sent</p>
                <p className={styles.statValue}>{user._count.messages}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Account Details */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Account Details</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label className={styles.label}>
                <Calendar size={16} /> Created
              </label>
              <p className={styles.value}>{new Date(user.createdAt).toLocaleString()}</p>
            </div>
            <div className={styles.infoItem}>
              <label className={styles.label}>
                <Calendar size={16} /> Last Updated
              </label>
              <p className={styles.value}>{new Date(user.updatedAt).toLocaleString()}</p>
            </div>
            {user.emailVerified && (
              <div className={styles.infoItem}>
                <label className={styles.label}>Email Verified On</label>
                <p className={styles.value}>{new Date(user.emailVerified).toLocaleString()}</p>
              </div>
            )}
            {user.phoneVerified && (
              <div className={styles.infoItem}>
                <label className={styles.label}>Phone Verified On</label>
                <p className={styles.value}>{new Date(user.phoneVerified).toLocaleString()}</p>
              </div>
            )}
          </div>
        </section>

        {/* Admin Actions */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Admin Actions</h2>
          <p className={styles.emptyNote}>Action buttons (Send Message, Flag User, Ban Account) will be implemented in the next iteration.</p>
        </section>
      </div>
    </div>
  );
}
