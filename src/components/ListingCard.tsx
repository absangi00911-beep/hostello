'use client'

import Link from 'next/link'
import styles from './ListingCard.module.css'
import Button from './Button'

interface Hostel {
  id: number | string
  name: string
  location?: string
  city?: string
  price?: number
  pricePerMonth?: number
  rating: number
  reviews?: number
  reviewCount?: number
  image?: string
  coverImage?: string
  amenities: string[]
  availability?: number
  slug?: string
}

interface ListingCardProps {
  hostel: Hostel
}

export default function ListingCard({ hostel }: ListingCardProps) {
  const city = hostel.city || hostel.location || 'Unknown'
  const price = hostel.price ?? hostel.pricePerMonth ?? 0
  const reviews = hostel.reviews ?? hostel.reviewCount ?? 0
  const image = hostel.image ?? hostel.coverImage ?? ''
  const href = `/hostels/${hostel.slug || hostel.id}`
  
  return (
    <div className={styles.card}>
      <div className={styles.image}>
        <img src={image} alt={hostel.name} loading="lazy" />
        {hostel.availability && hostel.availability <= 5 && (
          <div className={styles.badge}>Only {hostel.availability} left</div>
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>{hostel.name}</h3>
            <p className={styles.location}>{city}</p>
          </div>
          <div className={styles.rating}>
            <span className={styles.stars}>★</span>
            <span className={styles.score}>{hostel.rating}</span>
            <span className={styles.reviews}>({reviews})</span>
          </div>
        </div>

        <div className={styles.amenities}>
          {hostel.amenities.map((amenity, idx) => (
            <span key={idx} className={styles.amenityTag}>
              {amenity}
            </span>
          ))}
        </div>

        <div className={styles.footer}>
          <div className={styles.price}>
            <span className={styles.amount}>PKR {price}</span>
            <span className={styles.period}>/night</span>
          </div>
          <Link href={href} style={{ flex: 1 }}>
            <Button style={{ width: '100%' }}>
              View & Book
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
