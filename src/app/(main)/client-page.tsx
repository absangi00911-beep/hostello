'use client'

import { useState, useRef, useEffect } from 'react'
import SearchBar from '@/components/SearchBar'
import Hero from '@/components/Hero'
import ListingCard from '@/components/ListingCard'
import FilterPanel from '@/components/FilterPanel'
import Button from '@/components/Button'
import styles from './client-page.module.css'

const MOCK_HOSTELS = [
  {
    id: 1,
    name: 'Green Haven Hostel',
    location: 'Lahore',
    price: 2500,
    rating: 4.8,
    reviews: 142,
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop',
    amenities: ['WiFi', 'Kitchen', 'Laundry'],
    availability: 12,
  },
  {
    id: 2,
    name: 'Student Hub Islamabad',
    location: 'Islamabad',
    price: 3000,
    rating: 4.6,
    reviews: 98,
    image: 'https://images.unsplash.com/photo-1554321586-92083f3667c9?w=400&h=300&fit=crop',
    amenities: ['WiFi', 'Common Area', 'Parking'],
    availability: 8,
  },
  {
    id: 3,
    name: 'Karachi Retreat',
    location: 'Karachi',
    price: 2000,
    rating: 4.5,
    reviews: 67,
    image: 'https://images.unsplash.com/photo-1608771318577-720bba26d59c?w=400&h=300&fit=crop',
    amenities: ['WiFi', 'AC', 'Security'],
    availability: 15,
  },
  {
    id: 4,
    name: 'Comfort Zone Lahore',
    location: 'Lahore',
    price: 2800,
    rating: 4.7,
    reviews: 112,
    image: 'https://images.unsplash.com/photo-1527004760902-c448a0f47f5f?w=400&h=300&fit=crop',
    amenities: ['WiFi', 'Gym', 'Cafeteria'],
    availability: 5,
  },
]

export function ClientPage() {
  const [filteredHostels, setFilteredHostels] = useState(MOCK_HOSTELS)
  const [showFilters, setShowFilters] = useState(false)
  const liveRegionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = `${filteredHostels.length} hostels found`
    }
  }, [filteredHostels.length])

  const handleSearch = (query: string) => {
    if (!query.trim()) return
    window.location.href = `/search?q=${encodeURIComponent(query)}`
  }

  const handleFilter = (filters: any) => {
    let results = MOCK_HOSTELS
    if (filters.location) {
      results = results.filter(h => h.location === filters.location)
    }
    if (filters.priceRange) {
      results = results.filter(h => h.price >= filters.priceRange[0] && h.price <= filters.priceRange[1])
    }
    setFilteredHostels(results)
  }

  return (
    <div className={styles.wrapper}>
      <Hero onSearch={handleSearch} />
      <div className={`${styles.container} container`}>
        <div
          ref={liveRegionRef}
          className={styles.liveRegion}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {filteredHostels.length} hostels found
        </div>
        <div className={styles.mainGrid}>
          <div className={styles.filtersDesktop}>
            <FilterPanel onFilter={handleFilter} />
          </div>
          <div>
            <div className={styles.filterToggle}>
              <p className={styles.resultsCount}>
                {filteredHostels.length} hostels found
              </p>
              <Button onClick={() => setShowFilters(!showFilters)} variant="secondary">
                {showFilters ? 'Hide' : 'Filter'}
              </Button>
            </div>
            {showFilters && (
              <div className={styles.filtersMobile}>
                <FilterPanel onFilter={handleFilter} />
              </div>
            )}
            <div className={styles.listingsGrid}>
              {filteredHostels.map(hostel => (
                <ListingCard key={hostel.id} hostel={hostel} />
              ))}
            </div>
            {filteredHostels.length === 0 && (
              <div className={styles.emptyState}>
                <p className={styles.emptyStateTitle}>
                  No hostels found
                </p>
                <p className={styles.emptyStateDescription}>
                  Try adjusting your filters or search criteria
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
