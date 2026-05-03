'use client'

import SearchBar from './SearchBar'
import styles from './Hero.module.css'

interface HeroProps {
  onSearch: (query: string) => void
}

export default function Hero({ onSearch }: HeroProps) {
  return (
    <div className={styles.hero}>
      <div className="container" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className={styles.content}>
          <h1 className={styles.title}>Find Your Perfect Stay</h1>
          <p className={styles.subtitle}>
            Browse verified hostels, compare prices, and book directly from owners. No middlemen, no hidden fees.
          </p>
          <div className={styles.search}>
            <SearchBar onSearch={onSearch} />
          </div>
          <div className={styles.trust}>
            <div className={styles.trustItem}>
              <span className={styles.trustNumber}>200+</span>
              <span className={styles.trustLabel}>Verified hostels</span>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustNumber}>5k+</span>
              <span className={styles.trustLabel}>Real reviews</span>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustNumber}>10k+</span>
              <span className={styles.trustLabel}>Happy students</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
