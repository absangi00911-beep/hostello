'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Button from '@/components/Button'
import styles from './hostel-detail.module.css'

// Mock hostel data - in production, this would come from backend API
const HOSTEL_DETAILS: Record<string, any> = {
  '1': {
    id: 1,
    name: 'Green Haven Hostel',
    location: 'Lahore',
    city: 'Lahore',
    area: 'Gulberg',
    price: 2500,
    priceLabel: 'per night',
    rating: 4.8,
    reviews: 142,
    verified: true,
    availability: 12,
    images: [
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=600&fit=crop',
    ],
    amenities: ['WiFi', 'Kitchen', 'Laundry', 'Common Area', 'Lounge', 'Security'],
    description: 'Green Haven Hostel is a peaceful sanctuary in the heart of Lahore, offering comfortable and affordable accommodation for students and travelers. Our modern facilities and welcoming atmosphere make it the perfect choice for your stay.',
    owner: {
      name: 'Ahmed Hassan',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
      responseTime: '2 hours',
      verified: true,
    },
    reviewsList: [
      {
        id: 1,
        author: 'Sarah Khan',
        rating: 5,
        date: '2 weeks ago',
        text: 'Amazing hostel! Clean rooms, friendly staff, and great location. Definitely staying again.',
      },
      {
        id: 2,
        author: 'Ali Ahmed',
        rating: 4,
        date: '1 month ago',
        text: 'Good value for money. WiFi could be faster but overall great experience.',
      },
      {
        id: 3,
        author: 'Zara Ali',
        rating: 5,
        date: '1 month ago',
        text: 'Perfect for students! Close to university and super affordable.',
      },
    ],
  },
  '6': {
    id: 6,
    name: 'Premium Stay Lahore',
    location: 'Lahore',
    city: 'Lahore',
    area: 'Defence',
    price: 4500,
    priceLabel: 'per night',
    rating: 4.9,
    reviews: 203,
    verified: true,
    availability: 3,
    images: [
      'https://images.unsplash.com/photo-1611339555312-e607c90352fd?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1611339555312-e607c90352fd?w=800&h=600&fit=crop',
    ],
    amenities: ['WiFi', 'Kitchen', 'Gym', 'Cafeteria', 'Laundry', 'Security', 'AC', 'Parking'],
    description: 'Premium Stay Lahore offers luxury accommodation with top-notch facilities. Perfect for students and professionals seeking comfort and convenience.',
    owner: {
      name: 'Fatima Malik',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',
      responseTime: '30 minutes',
      verified: true,
    },
    reviewsList: [
      {
        id: 1,
        author: 'Hassan Raza',
        rating: 5,
        date: '1 week ago',
        text: 'Exceptional quality! Worth every rupee. Staff is incredible.',
      },
      {
        id: 2,
        author: 'Nida Khan',
        rating: 5,
        date: '2 weeks ago',
        text: 'Best hostel experience ever. Gym and cafeteria are fantastic.',
      },
    ],
  },
}

export default function HostelDetailPage() {
  const params = useParams()
  const id = params.id as string
  const hostel = HOSTEL_DETAILS[id]
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedDates, setSelectedDates] = useState({ checkIn: '', checkOut: '' })
  const [guestCount, setGuestCount] = useState(1)
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview')

  if (!hostel) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h1>Hostel Not Found</h1>
          <p>We couldn't find the hostel you're looking for.</p>
          <Button onClick={() => window.location.href = '/'}>Back to Home</Button>
        </div>
      </div>
    )
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % hostel.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + hostel.images.length) % hostel.images.length)
  }

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Booking:', { checkIn: selectedDates.checkIn, checkOut: selectedDates.checkOut, guests: guestCount })
    alert('Booking feature coming soon!')
  }

  const averageRating = (hostel.reviewsList.reduce((sum: number, r: any) => sum + r.rating, 0) / hostel.reviewsList.length).toFixed(1)

  return (
    <div className={styles.container}>
      {/* Photo Gallery */}
      <div className={styles.gallery}>
        <div className={styles.mainImage}>
          <img src={hostel.images[currentImageIndex]} alt={`${hostel.name} - Image ${currentImageIndex + 1}`} />
          {hostel.images.length > 1 && (
            <>
              <button className={styles.navButton} onClick={prevImage} aria-label="Previous image">
                ‹
              </button>
              <button className={styles.navButton} onClick={nextImage} style={{ right: 0 }} aria-label="Next image">
                ›
              </button>
            </>
          )}
          <div className={styles.imageCounter}>
            {currentImageIndex + 1} / {hostel.images.length}
          </div>
        </div>
        {hostel.images.length > 1 && (
          <div className={styles.thumbnails}>
            {hostel.images.map((_: string, idx: number) => (
              <button
                key={idx}
                className={`${styles.thumbnail} ${idx === currentImageIndex ? styles.active : ''}`}
                onClick={() => setCurrentImageIndex(idx)}
                aria-label={`View image ${idx + 1}`}
              >
                <img src={hostel.images[idx]} alt={`Thumbnail ${idx + 1}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={styles.content} style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-2xl)' }}>
        <div className="container">
          <div className={styles.mainGrid}>
            {/* Left Column - Details */}
            <div className={styles.details}>
              {/* Header */}
              <div className={styles.header}>
                <div>
                  <h1 className={styles.title}>{hostel.name}</h1>
                  <p className={styles.location}>
                    📍 {hostel.area}, {hostel.city}
                  </p>
                </div>
                <div className={styles.rating}>
                  <div className={styles.ratingBadge}>
                    <span className={styles.stars}>★</span>
                    <span className={styles.score}>{hostel.rating}</span>
                  </div>
                  <p className={styles.reviewCount}>({hostel.reviewsList.length} reviews)</p>
                </div>
              </div>

              {/* Tabs */}
              <div className={styles.tabs}>
                <button
                  className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'reviews' ? styles.active : ''}`}
                  onClick={() => setActiveTab('reviews')}
                >
                  Reviews ({hostel.reviewsList.length})
                </button>
              </div>

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className={styles.overview}>
                  {/* Description */}
                  <section className={styles.section}>
                    <h2>About</h2>
                    <p>{hostel.description}</p>
                  </section>

                  {/* Amenities */}
                  <section className={styles.section}>
                    <h2>Amenities</h2>
                    <div className={styles.amenitiesList}>
                      {hostel.amenities.map((amenity: string) => (
                        <div key={amenity} className={styles.amenityItem}>
                          <span className={styles.amenityIcon}>✓</span>
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Owner Info */}
                  <section className={styles.section}>
                    <h2>Hosted by</h2>
                    <div className={styles.ownerCard}>
                      <img src={hostel.owner.avatar} alt={hostel.owner.name} className={styles.ownerAvatar} />
                      <div className={styles.ownerInfo}>
                        <p className={styles.ownerName}>
                          {hostel.owner.name}
                          {hostel.owner.verified && <span className={styles.badge}>✓ Verified</span>}
                        </p>
                        <p className={styles.responseTime}>Responds in {hostel.owner.responseTime}</p>
                      </div>
                      <Button variant="secondary">Contact Host</Button>
                    </div>
                  </section>
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div className={styles.reviewsSection}>
                  <div className={styles.reviewStats}>
                    <div className={styles.avgRating}>
                      <div className={styles.rating}>
                        <span className={styles.stars}>★</span>
                        <span className={styles.score}>{averageRating}</span>
                      </div>
                      <p>Based on {hostel.reviewsList.length} reviews</p>
                    </div>
                  </div>

                  <div className={styles.reviewsList}>
                    {hostel.reviewsList.map((review: any) => (
                      <div key={review.id} className={styles.reviewItem}>
                        <div className={styles.reviewHeader}>
                          <p className={styles.reviewAuthor}>{review.author}</p>
                          <span className={styles.reviewDate}>{review.date}</span>
                        </div>
                        <div className={styles.reviewRating}>
                          {[...Array(5)].map((_: any, i: number) => (
                            <span key={i} className={i < review.rating ? styles.starFilled : styles.starEmpty}>
                              ★
                            </span>
                          ))}
                        </div>
                        <p className={styles.reviewText}>{review.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Booking */}
            <aside className={styles.sidebar}>
              <div className={styles.bookingCard}>
                <div className={styles.priceSection}>
                  <p className={styles.price}>
                    <span className={styles.amount}>PKR {hostel.price.toLocaleString()}</span>
                    <span className={styles.period}>/{hostel.priceLabel}</span>
                  </p>
                  <p className={styles.availability}>
                    {hostel.availability === 1 ? '1 room' : `${hostel.availability} rooms`} available
                  </p>
                </div>

                <form onSubmit={handleBooking} className={styles.bookingForm}>
                  <div className={styles.formGroup}>
                    <label htmlFor="check-in">Check In</label>
                    <input
                      id="check-in"
                      type="date"
                      value={selectedDates.checkIn}
                      onChange={(e) => setSelectedDates({ ...selectedDates, checkIn: e.target.value })}
                      required
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="check-out">Check Out</label>
                    <input
                      id="check-out"
                      type="date"
                      value={selectedDates.checkOut}
                      onChange={(e) => setSelectedDates({ ...selectedDates, checkOut: e.target.value })}
                      required
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="guests">Guests</label>
                    <select
                      id="guests"
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                      className={styles.input}
                    >
                      {[1, 2, 3, 4, 5].map((num: number) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'guest' : 'guests'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button type="submit" style={{ width: '100%' }}>
                    Book Now
                  </Button>
                </form>

                <p className={styles.disclaimer}>You won't be charged yet</p>

                {hostel.verified && (
                  <div className={styles.trustBadge}>
                    ✓ Verified Listing
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
