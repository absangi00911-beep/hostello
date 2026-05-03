import { db } from "@/lib/db";
import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";
import styles from "./hostels.module.css";

export const metadata = {
  title: "Manage Hostels - Admin",
};

export default async function AdminHostelsPage() {
  const [pendingHostels, activeHostels, suspendedHostels, allHostels] = await Promise.all([
    db.hostel.count({ where: { status: "PENDING_REVIEW" } }),
    db.hostel.count({ where: { status: "ACTIVE" } }),
    db.hostel.count({ where: { status: "SUSPENDED" } }),
    db.hostel.findMany({
      orderBy: { createdAt: "desc" },
      include: { owner: { select: { name: true, email: true } } },
    }),
  ]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Hostel Management</h1>
        <p className={styles.subtitle}>Approve, suspend, or remove hostels</p>
      </div>

      {/* Status Overview */}
      <section aria-label="Hostel status overview">
        <div className={styles.statusGrid}>
          <div className={styles.statusCard} aria-label={`Pending Review: ${pendingHostels} hostels`}>
            <p className={styles.statusLabel}>Pending Review</p>
            <p className={styles.statusCount}>{pendingHostels}</p>
          </div>
          <div className={styles.statusCard} aria-label={`Active: ${activeHostels} hostels`}>
            <p className={styles.statusLabel}>Active</p>
            <p className={styles.statusCount}>{activeHostels}</p>
          </div>
          <div className={styles.statusCard} aria-label={`Suspended: ${suspendedHostels} hostels`}>
            <p className={styles.statusLabel}>Suspended</p>
            <p className={styles.statusCount}>{suspendedHostels}</p>
          </div>
          <div className={styles.statusCard} aria-label={`Total: ${allHostels.length} hostels`}>
            <p className={styles.statusLabel}>Total</p>
            <p className={styles.statusCount}>{allHostels.length}</p>
          </div>
        </div>
      </section>

      {/* Hostels Table */}
      <section className={styles.section}>
        <div className={styles.tableContainer}>
          <div className={styles.table} role="table" aria-label="All hostels table">
            <div className={styles.tableHeader} role="row">
              <div className={styles.colName} role="columnheader">Hostel Name</div>
              <div className={styles.colOwner} role="columnheader">Owner</div>
              <div className={styles.colCity} role="columnheader">City</div>
              <div className={styles.colStatus} role="columnheader">Status</div>
              <div className={styles.colRating} role="columnheader">Rating</div>
              <div className={styles.colCreated} role="columnheader">Created</div>
              <div className={styles.colAction} role="columnheader">Action</div>
            </div>

            {allHostels.length === 0 ? (
              <div className={styles.emptyState} role="status">
                <h3>No Hostels Found</h3>
                <p>No hostels exist in the system yet. New hostel submissions will appear here.</p>
              </div>
            ) : (
              allHostels.map((hostel) => (
                <div key={hostel.id} className={styles.tableRow} role="row">
                  <div className={styles.colName} role="cell">
                    <span className={styles.hostelName}>{hostel.name}</span>
                  </div>
                  <div className={styles.colOwner} role="cell">{hostel.owner.name}</div>
                  <div className={styles.colCity} role="cell">{hostel.city}</div>
                  <div className={styles.colStatus} role="cell">
                    <span
                      className={`${styles.badge} ${
                        hostel.status === "ACTIVE"
                          ? styles.badgeSuccess
                          : hostel.status === "PENDING_REVIEW"
                            ? styles.badgeWarning
                            : styles.badgeDanger
                      }`}
                      aria-label={`Status: ${
                        hostel.status === "PENDING_REVIEW"
                          ? "Pending Review"
                          : hostel.status === "ACTIVE"
                            ? "Active"
                            : hostel.status === "SUSPENDED"
                              ? "Suspended"
                              : "Draft"
                      }`}
                    >
                      {hostel.status === "PENDING_REVIEW"
                        ? "Pending"
                        : hostel.status === "ACTIVE"
                          ? "Active"
                          : hostel.status === "SUSPENDED"
                            ? "Suspended"
                            : "Draft"}
                    </span>
                  </div>
                  <div className={styles.colRating} role="cell">
                    {hostel.rating > 0 ? (
                      <span aria-label={`Rating: ${hostel.rating.toFixed(1)} out of 5 with ${hostel.reviewCount} reviews`}>
                        ★ {hostel.rating.toFixed(1)} ({hostel.reviewCount})
                      </span>
                    ) : (
                      <span className={styles.noRating}>No reviews</span>
                    )}
                  </div>
                  <div className={styles.colCreated} role="cell">
                    {new Date(hostel.createdAt).toLocaleDateString()}
                  </div>
                  <div className={styles.colAction} role="cell">
                    <Link href={`/admin/hostels/${hostel.id}`} className={styles.actionLink} aria-label={`View details for ${hostel.name}`}>
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
