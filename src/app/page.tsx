'use client'

import { useState } from 'react'
import SearchBar from '@/components/SearchBar'
import Hero from '@/components/Hero'
import ListingCard from '@/components/ListingCard'
import FilterPanel from '@/components/FilterPanel'
import Button from '@/components/Button'

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

export default function Home() {
  const [filteredHostels, setFilteredHostels] = useState(MOCK_HOSTELS)
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = (query: string) => {
    if (!query.trim()) return
    // Navigate to search results page with query parameter
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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-ground)' }}>
      {/* Hero Section */}
      <Hero onSearch={handleSearch} />

      {/* Main Content */}
      <div style={{ paddingTop: 'var(--space-xl)' }} className="container">
        <div className="mainGrid">
          {/* Filters - Desktop */}
          <div className="filtersDesktop">
            <FilterPanel onFilter={handleFilter} />
          </div>

          {/* Results */}
          <div>
            {/* Mobile Filter Toggle */}
            <div className="filterToggle">
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                {filteredHostels.length} hostels found
              </p>
              <Button onClick={() => setShowFilters(!showFilters)} variant="secondary">
                {showFilters ? 'Hide' : 'Filter'}
              </Button>
            </div>

            {/* Mobile Filter Panel */}
            {showFilters && (
              <div className="filtersMobile">
                <FilterPanel onFilter={handleFilter} />
              </div>
            )}

            {/* Listings Grid */}
            <div className="listingsGrid">
              {filteredHostels.map(hostel => (
                <ListingCard key={hostel.id} hostel={hostel} />
              ))}
            </div>

            {/* Empty State */}
            {filteredHostels.length === 0 && (
              <div style={{ textAlign: 'center', paddingTop: 'var(--space-2xl)', paddingBottom: 'var(--space-2xl)' }}>
                <p style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
                  No hostels found
                </p>
                <p style={{ color: 'var(--color-text-muted)' }}>
                  Try adjusting your filters or search criteria
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .mainGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-lg);
        }

        @media (min-width: 1024px) {
          .mainGrid {
            grid-template-columns: 280px 1fr;
          }
        }

        .filtersDesktop {
          display: none;
        }

        @media (min-width: 1024px) {
          .filtersDesktop {
            display: block;
          }
        }

        .filterToggle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-lg);
        }

        @media (min-width: 1024px) {
          .filterToggle {
            display: none;
          }
        }

        .filtersMobile {
          margin-bottom: var(--space-lg);
        }

        @media (min-width: 1024px) {
          .filtersMobile {
            display: none;
          }
        }

        .listingsGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-lg);
        }

        @media (min-width: 640px) {
          .listingsGrid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .listingsGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
