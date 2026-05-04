import React from 'react'
import styles from './layout.module.css'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.content}>
          {children}
        </div>
        <div className={styles.sidePanel}>
          <div className={styles.sidePanelContent}>
            <h2 className={styles.sidePanelTitle}>A clearer way to book and manage hostels</h2>
            <p className={styles.sidePanelText}>
              Verified listings, direct messages, and booking tools in one place for students and owners.
            </p>
            <div className={styles.features}>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>✓</span>
                <span className={styles.featureLabel}>Verified hostel listings</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>✓</span>
                <span className={styles.featureLabel}>Real reviews and direct messages</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>✓</span>
                <span className={styles.featureLabel}>One dashboard for bookings and listing tools</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
