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
            <h2 className={styles.sidePanelTitle}>Welcome to HostelLo</h2>
            <p className={styles.sidePanelText}>
              Find your perfect student hostel. Direct bookings, no middlemen, transparent pricing.
            </p>
            <div className={styles.features}>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>✓</span>
                <span className={styles.featureLabel}>200+ Verified Hostels</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>✓</span>
                <span className={styles.featureLabel}>5k+ Real Reviews</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>✓</span>
                <span className={styles.featureLabel}>Instant Booking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
