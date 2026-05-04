'use client'

import { useState } from 'react'
import styles from './FilterPanel.module.css'
import Button from './Button'

interface FilterPanelProps {
  onFilter: (filters: any) => void
}

export default function FilterPanel({ onFilter }: FilterPanelProps) {
  const [priceRange, setPriceRange] = useState([0, 5000])
  const [location, setLocation] = useState('')
  const [amenities, setAmenities] = useState<string[]>([])

  const locations = ['Lahore', 'Islamabad', 'Karachi', 'Peshawar']
  const amenityOptions = ['WiFi', 'Kitchen', 'Laundry', 'Common Area', 'Parking', 'AC', 'Security', 'Gym']

  const handleAmenityChange = (amenity: string) => {
    setAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    )
  }

  const handleApplyFilters = () => {
    onFilter({
      priceRange,
      location,
      amenities,
    })
  }

  const handleReset = () => {
    setPriceRange([0, 5000])
    setLocation('')
    setAmenities([])
    onFilter({
      priceRange: [0, 5000],
      location: '',
      amenities: [],
    })
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Filters</h3>

      {/* Location */}
      <div className={styles.section}>
        <label className={styles.label}>Location</label>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={styles.select}
        >
          <option value="">All locations</option>
          {locations.map(loc => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div className={styles.section}>
        <label className={styles.label}>Price Range</label>
        <div className={styles.priceDisplay}>
          <span>PKR {priceRange[0]}</span>
          <span>-</span>
          <span>PKR {priceRange[1]}</span>
        </div>
        <input
          type="range"
          min="0"
          max="5000"
          step="100"
          value={priceRange[1]}
          onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
          className={styles.slider}
          aria-label="Price range maximum"
        />
      </div>

      {/* Amenities */}
      <div className={styles.section}>
        <label className={styles.label}>Amenities</label>
        <div className={styles.checkboxGroup}>
          {amenityOptions.map(amenity => (
            <label key={amenity} className={styles.checkbox}>
              <input
                type="checkbox"
                checked={amenities.includes(amenity)}
                onChange={() => handleAmenityChange(amenity)}
              />
              <span>{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <Button onClick={handleApplyFilters} variant="primary">
          Apply Filters
        </Button>
        <Button onClick={handleReset} variant="secondary">
          Reset
        </Button>
      </div>
    </div>
  )
}
