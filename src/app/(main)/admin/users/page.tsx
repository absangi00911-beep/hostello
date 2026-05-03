import { db } from "@/lib/db";
import { Mail, Phone, UserCheck, UserX } from "lucide-react";
import styles from "./users.module.css";

export const metadata = {
  title: "Manage Users - Admin",
};

export default async function AdminUsersPage() {
  const [totalUsers, studentUsers, ownerUsers, verifiedEmails, verifiedPhones, allUsers] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "STUDENT" } }),
    db.user.count({ where: { role: "OWNER" } }),
    db.user.count({ where: { emailVerified: { not: null } } }),
    db.user.count({ where: { phoneVerified: { not: null } } }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        _count: { select: { bookings: true, hostels: true } },
      },
    }),
  ]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>User Management</h1>
        <p className={styles.subtitle}>Monitor and manage user accounts</p>
      </div>

      {/* User Stats */}
      <section aria-label="User statistics">
        <div className={styles.statsGrid}>
          <div className={styles.statCard} aria-label={`Total Users: ${totalUsers}`}>
            <p className={styles.statLabel}>Total Users</p>
            <p className={styles.statValue}>{totalUsers}</p>
          </div>
          <div className={styles.statCard} aria-label={`Students: ${studentUsers}`}>
            <p className={styles.statLabel}>Students</p>
            <p className={styles.statValue}>{studentUsers}</p>
          </div>
          <div className={styles.statCard} aria-label={`Owners: ${ownerUsers}`}>
            <p className={styles.statLabel}>Owners</p>
            <p className={styles.statValue}>{ownerUsers}</p>
          </div>
          <div className={styles.statCard} aria-label={`Email Verified: ${verifiedEmails} out of ${totalUsers}`}>
            <p className={styles.statLabel}>Email Verified</p>
            <p className={styles.statValue}>{verifiedEmails}</p>
          </div>
          <div className={styles.statCard} aria-label={`Phone Verified: ${verifiedPhones} out of ${totalUsers}`}>
            <p className={styles.statLabel}>Phone Verified</p>
            <p className={styles.statValue}>{verifiedPhones}</p>
          </div>
          <div className={styles.statCard} aria-label={`Verification Rate: ${totalUsers > 0 ? ((verifiedEmails / totalUsers) * 100).toFixed(0) : 0}%`}>
            <p className={styles.statLabel}>Verification Rate</p>
            <p className={styles.statValue}>
              {totalUsers > 0 ? ((verifiedEmails / totalUsers) * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>
      </section>

      {/* Users Table */}
      <section className={styles.section}>
        <div className={styles.tableContainer}>
          <div className={styles.table} role="table" aria-label="All users table">
            <div className={styles.tableHeader} role="row">
              <div className={styles.colName} role="columnheader">Name</div>
              <div className={styles.colEmail} role="columnheader">Email</div>
              <div className={styles.colPhone} role="columnheader">Phone</div>
              <div className={styles.colRole} role="columnheader">Role</div>
              <div className={styles.colVerified} role="columnheader">Verified</div>
              <div className={styles.colActivity} role="columnheader">Activity</div>
              <div className={styles.colJoined} role="columnheader">Joined</div>
            </div>

            {allUsers.length === 0 ? (
              <div className={styles.emptyState} role="status">
                <h3>No Users Found</h3>
                <p>No user accounts exist in the system yet. New accounts will appear here.</p>
              </div>
            ) : (
              allUsers.map((user) => (
                <div key={user.id} className={styles.tableRow} role="row">
                  <div className={styles.colName} role="cell">
                    <span className={styles.userName}>{user.name}</span>
                  </div>
                  <div className={styles.colEmail} role="cell">
                    <span className={styles.email}>
                      {user.emailVerified ? (
                        <UserCheck size={14} className={styles.verifiedIcon} aria-label="Email verified" />
                      ) : (
                        <UserX size={14} className={styles.unverifiedIcon} aria-label="Email not verified" />
                      )}
                      {user.email}
                    </span>
                  </div>
                  <div className={styles.colPhone} role="cell">
                    {user.phone ? (
                      <span className={styles.phone}>
                        {user.phoneVerified ? (
                          <UserCheck size={14} className={styles.verifiedIcon} aria-label="Phone verified" />
                        ) : (
                          <UserX size={14} className={styles.unverifiedIcon} aria-label="Phone not verified" />
                        )}
                        {user.phone}
                      </span>
                    ) : (
                      <span className={styles.notProvided}>Not provided</span>
                    )}
                  </div>
                  <div className={styles.colRole} role="cell">
                    <span className={`${styles.badge} ${styles[`badge${user.role}`]}`} aria-label={`Role: ${user.role}`}>
                      {user.role}
                    </span>
                  </div>
                  <div className={styles.colVerified} role="cell">
                    <span
                      className={`${styles.verificationBadge} ${
                        user.emailVerified ? styles.verified : styles.unverified
                      }`}
                      aria-label={`Email verification status: ${user.emailVerified ? "Verified" : "Unverified"}`}
                    >
                      {user.emailVerified ? "✓ Verified" : "✗ Unverified"}
                    </span>
                  </div>
                  <div className={styles.colActivity} role="cell">
                    {user.role === "OWNER" ? (
                      <span aria-label={`${user._count.hostels} hostels created`}>{user._count.hostels} hostels</span>
                    ) : (
                      <span aria-label={`${user._count.bookings} bookings made`}>{user._count.bookings} bookings</span>
                    )}
                  </div>
                  <div className={styles.colJoined} role="cell">
                    {new Date(user.createdAt).toLocaleDateString()}
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
