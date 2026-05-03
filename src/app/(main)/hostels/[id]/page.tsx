'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { fetchHostelBySlug, type HostelDetail } from '@/lib/api-client'
import Button from '@/components/Button'
import styles from './hostel-detail.module.css'

export default function HostelDetailPage() {
  const params = useParams()
  const slug = params.id as string

  const [hostel, setHostel] = useState<HostelDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedDates, setSelectedDates] = useState({ checkIn: '', checkOut: '' })
  const [guestCount, setGuestCount] = useState(1)
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview')

  // Fetch hostel data from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await fetchHostelBySlug(slug)
        setHostel(data)
      } catch (err) {
        console.error('Failed to fetch hostel:', err)
        setError(err instanceof Error ? err.message : 'Failed to load hostel')
        setHostel(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (slug) {
      fetchData()
    }
  }, [slug])

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h1>Loading...</h1>
          <p>Please wait while we load the hostel details.</p>
        </div>
      </div>
    )
  }

  if (error || !hostel) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h1>Hostel Not Found</h1>
          <p>{error || 'We couldn\'t find the hostel you\'re looking for.'}</p>
          <Button onClick={() => (window.location.href = '/')}>Back to Home</Button>
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
    if (!selectedDates.checkIn || !selectedDates.checkOut) {
      alert('Please select both check-in and check-out dates')
      return
    }
    // Navigate to checkout with booking parameters
    const params = new URLSearchParams({
      hostelId: hostel.id,
      checkIn: selectedDates.checkIn,
      checkOut: selectedDates.checkOut,
      guests: guestCount.toString(),
    })
    window.location.href = `/checkout?${params.toString()}`
  }

  const averageRating = hostel.rating.toFixed(1)

  return (
    <div className={styles.container}>
      {/* Photo Gallery */}
      <div className={styles.gallery}>
        <div className={styles.mainImage}>
          <img src={hostel.images[currentImageIndex] || ''} alt={`${hostel.name} - Image ${currentImageIndex + 1}`} />
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
                  <p className={styles.reviewCount}>({hostel.reviews.length} reviews)</p>
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
                  Reviews ({hostel.reviews.length})
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
                      <img src={hostel.owner.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt={hostel.owner.name} className={styles.ownerAvatar} />
                      <div className={styles.ownerInfo}>
                        <p className={styles.ownerName}>
                          {hostel.owner.name}
                          <span className={styles.badge}>✓ Verified</span>
                        </p>
                        <p className={styles.responseTime}>{hostel.owner._count.hostels} hostel{hostel.owner._count.hostels !== 1 ? 's' : ''}</p>
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
                      <p>Based on {hostel.reviews.length} reviews</p>
                    </div>
                  </div>

                  <div className={styles.reviewsList}>
                    {hostel.reviews.map((review) => (
                      <div key={review.id} className={styles.reviewItem}>
                        <div className={styles.reviewHeader}>
                          <p className={styles.reviewAuthor}>{review.user.name}</p>
                          <span className={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className={styles.reviewRating}>
                          {[...Array(5)].map((_: any, i: number) => (
                            <span key={i} className={i < review.rating ? styles.starFilled : styles.starEmpty}>
                              ★
                            </span>
                          ))}
                        </div>
                        <p className={styles.reviewText}>{review.comment}</p>
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
                    <span className={styles.amount}>PKR {hostel.pricePerMonth.toLocaleString()}</span>
                    <span className={styles.period}>/month</span>
                  </p>
                  <p className={styles.availability}>
                    Capacity: {hostel.capacity} guest{hostel.capacity !== 1 ? 's' : ''}
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
