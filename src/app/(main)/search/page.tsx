'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { fetchHostels, type HostelSummary } from '@/lib/api-client'
import SearchBar from '@/components/SearchBar'
import ListingCard from '@/components/ListingCard'
import FilterPanel from '@/components/FilterPanel'
import Button from '@/components/Button'
import styles from './search.module.css'

function SearchResultsContent() {
  const searchParams = useSearchParams()
  const [hostels, setHostels] = useState<HostelSummary[]>([])
  const [filteredResults, setFilteredResults] = useState<HostelSummary[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'rating' | 'newest'>('rating')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const searchQuery = searchParams.get('q') || ''
  const locationFilter = searchParams.get('location') || ''
  const priceMin = parseInt(searchParams.get('priceMin') || '0')
  const priceMax = parseInt(searchParams.get('priceMax') || '5000')

  // Fetch hostels from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params: Record<string, string> = {
          page: '1',
          limit: '50',
          sort: sortBy,
          minPrice: priceMin.toString(),
          maxPrice: priceMax.toString(),
        }

        if (searchQuery) params.q = searchQuery
        if (locationFilter) params.city = locationFilter

        const response = await fetchHostels(params)
        setHostels(response.data)
      } catch (err) {
        console.error('Failed to fetch hostels:', err)
        setError(err instanceof Error ? err.message : 'Failed to load hostels')
        setHostels([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [searchQuery, locationFilter, priceMin, priceMax, sortBy])

  // Apply client-side sorting to already-fetched results
  useEffect(() => {
    let results = [...hostels]

    // Sort results based on sortBy
    if (sortBy === 'price_asc') {
      results.sort((a, b) => a.pricePerMonth - b.pricePerMonth)
    } else if (sortBy === 'price_desc') {
      results.sort((a, b) => b.pricePerMonth - a.pricePerMonth)
    } else if (sortBy === 'rating') {
      results.sort((a, b) => b.rating - a.rating)
    }

    setFilteredResults(results)
  }, [hostels, sortBy])

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
            {isLoading ? 'Loading...' : `${filteredResults.length} ${filteredResults.length === 1 ? 'hostel' : 'hostels'} found`}
            {searchQuery && ` for "${searchQuery}"`}
          </p>
          <div className={styles.searchBox}>
            <SearchBar onSearch={handleNewSearch} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-2xl)' }} className="container">
        {error ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>⚠️</div>
            <h2 className={styles.emptyTitle}>Error loading hostels</h2>
            <p className={styles.emptyDescription}>{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : (
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
                    onChange={(e) => setSortBy(e.target.value as 'price_asc' | 'price_desc' | 'rating' | 'newest')}
                    className={styles.sortSelect}
                  >
                    <option value="rating">Highest Rated</option>
                    <option value="newest">Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
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

              {/* Loading State */}
              {isLoading ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>⏳</div>
                  <h2 className={styles.emptyTitle}>Loading hostels...</h2>
                  <p className={styles.emptyDescription}>Please wait while we fetch the best options for you.</p>
                </div>
              ) : filteredResults.length > 0 ? (
                <>
                  {/* Results Grid */}
                  <div className={styles.grid}>
                    {filteredResults.map(hostel => (
                      <ListingCard 
                        key={hostel.id} 
                        hostel={{
                          id: hostel.id,
                          name: hostel.name,
                          city: hostel.city,
                          price: hostel.pricePerMonth,
                          rating: hostel.rating,
                          reviews: hostel.reviewCount,
                          image: hostel.coverImage || hostel.images[0] || '',
                          amenities: hostel.amenities,
                        }}
                      />
                    ))}
                  </div>

                  {/* Results Info */}
                  <div className={styles.resultInfo}>
                    <p className={styles.resultCount}>
                      Showing all {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </>
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
            </div>
          </div>
        )}
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
