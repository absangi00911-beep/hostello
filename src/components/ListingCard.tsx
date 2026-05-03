'use client'

import styles from './ListingCard.module.css'
import Button from './Button'

interface Hostel {
  id: number
  name: string
  location: string
  price: number
  rating: number
  reviews: number
  image: string
  amenities: string[]
  availability: number
}

interface ListingCardProps {
  hostel: Hostel
}

export default function ListingCard({ hostel }: ListingCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.image}>
        <img src={hostel.image} alt={hostel.name} />
        {hostel.availability <= 5 && (
          <div className={styles.badge}>Only {hostel.availability} left</div>
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>{hostel.name}</h3>
            <p className={styles.location}>{hostel.location}</p>
          </div>
          <div className={styles.rating}>
            <span className={styles.stars}>★</span>
            <span className={styles.score}>{hostel.rating}</span>
            <span className={styles.reviews}>({hostel.reviews})</span>
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
            <span className={styles.amount}>PKR {hostel.price}</span>
            <span className={styles.period}>/night</span>
          </div>
          <Button onClick={() => console.log(`View ${hostel.name}`)}>
            View & Book
          </Button>
        </div>
      </div>
    </div>
  )
}
