'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import SearchBar from '@/components/SearchBar'
import ListingCard from '@/components/ListingCard'
import FilterPanel from '@/components/FilterPanel'
import Button from '@/components/Button'
import styles from './search.module.css'

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
  {
    id: 5,
    name: 'Budget Backpackers Peshawar',
    location: 'Peshawar',
    price: 1800,
    rating: 4.3,
    reviews: 54,
    image: 'https://images.unsplash.com/photo-1618765885263-76c3b4c4f1b7?w=400&h=300&fit=crop',
    amenities: ['WiFi', 'Common Area', 'Lounge'],
    availability: 20,
  },
  {
    id: 6,
    name: 'Premium Stay Lahore',
    location: 'Lahore',
    price: 4500,
    rating: 4.9,
    reviews: 203,
    image: 'https://images.unsplash.com/photo-1611339555312-e607c90352fd?w=400&h=300&fit=crop',
    amenities: ['WiFi', 'Kitchen', 'Gym', 'Cafeteria'],
    availability: 3,
  },
]

function SearchResultsContent() {
  const searchParams = useSearchParams()
  const [filteredResults, setFilteredResults] = useState(MOCK_HOSTELS)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'reviews'>('rating')

  const searchQuery = searchParams.get('q') || ''
  const locationFilter = searchParams.get('location') || ''
  const priceMin = parseInt(searchParams.get('priceMin') || '0')
  const priceMax = parseInt(searchParams.get('priceMax') || '5000')

  // Apply filters whenever search params or sort changes
  useEffect(() => {
    let results = MOCK_HOSTELS

    // Filter by search query
    if (searchQuery) {
      results = results.filter(h =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by location
    if (locationFilter) {
      results = results.filter(h => h.location === locationFilter)
    }

    // Filter by price range
    results = results.filter(h => h.price >= priceMin && h.price <= priceMax)

    // Sort results
    if (sortBy === 'price') {
      results.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'rating') {
      results.sort((a, b) => b.rating - a.rating)
    } else if (sortBy === 'reviews') {
      results.sort((a, b) => b.reviews - a.reviews)
    }

    setFilteredResults(results)
  }, [searchQuery, locationFilter, priceMin, priceMax, sortBy])

  const handleNewSearch = (query: string) => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    window.location.href = `/search?${params.toString()}`
  }

  const handleFilterChange = (filters: any) => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (filters.location) params.set('location', filters.location)
    if (filters.priceRange) {
      params.set('priceMin', filters.priceRange[0].toString())
      params.set('priceMax', filters.priceRange[1].toString())
    }
    window.history.replaceState({}, '', `/search?${params.toString()}`)
  }

  return (
    <div className={styles.container}>
      {/* Search Header */}
      <div className={styles.header}>
        <div className="container">
          <h1 className={styles.title}>Search Results</h1>
          <p className={styles.subtitle}>
            {filteredResults.length} {filteredResults.length === 1 ? 'hostel' : 'hostels'} found
            {searchQuery && ` for "${searchQuery}"`}
          </p>
          <div className={styles.searchBox}>
            <SearchBar onSearch={handleNewSearch} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-2xl)' }} className="container">
        <div className={styles.mainGrid}>
          {/* Filters - Desktop */}
          <div className={styles.filtersDesktop}>
            <FilterPanel onFilter={handleFilterChange} />
          </div>

          {/* Results */}
          <div className={styles.results}>
            {/* Mobile Filter Toggle & Sort */}
            <div className={styles.controls}>
              <div className={styles.controlsLeft}>
                <Button onClick={() => setShowFilters(!showFilters)} variant="secondary">
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </div>
              <div className={styles.controlsRight}>
                <label htmlFor="sort-select" className={styles.sortLabel}>
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'price' | 'rating' | 'reviews')}
                  className={styles.sortSelect}
                >
                  <option value="rating">Highest Rated</option>
                  <option value="reviews">Most Reviews</option>
                  <option value="price">Price: Low to High</option>
                </select>
              </div>
            </div>

            {/* Mobile Filter Panel */}
            {showFilters && (
              <div className={styles.filtersMobile}>
                <FilterPanel onFilter={handleFilterChange} />
              </div>
            )}

            {/* Active Filters Display */}
            {(searchQuery || locationFilter || priceMin > 0 || priceMax < 5000) && (
              <div className={styles.activeFilters}>
                <span className={styles.filterLabel}>Active filters:</span>
                {searchQuery && (
                  <span className={styles.filterTag}>
                    Search: "{searchQuery}"
                  </span>
                )}
                {locationFilter && (
                  <span className={styles.filterTag}>
                    Location: {locationFilter}
                  </span>
                )}
                {(priceMin > 0 || priceMax < 5000) && (
                  <span className={styles.filterTag}>
                    Price: PKR {priceMin} - {priceMax}
                  </span>
                )}
              </div>
            )}

            {/* Results Grid */}
            {filteredResults.length > 0 ? (
              <div className={styles.grid}>
                {filteredResults.map(hostel => (
                  <ListingCard key={hostel.id} hostel={hostel} />
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔍</div>
                <h2 className={styles.emptyTitle}>No hostels found</h2>
                <p className={styles.emptyDescription}>
                  Try adjusting your search terms or filters to find the perfect hostel.
                </p>
                <Button onClick={() => (window.location.href = '/')}>
                  Browse All Hostels
                </Button>
              </div>
            )}

            {/* Results Info */}
            {filteredResults.length > 0 && (
              <div className={styles.resultInfo}>
                <p className={styles.resultCount}>
                  Showing all {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchResultsContent />
    </Suspense>
  )
}
