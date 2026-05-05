'use client';

import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface FilterState {
  city: string;
  hostelType: 'boys' | 'girls' | 'mixed';
  priceMin: number;
  priceMax: number;
  amenities: string[];
}

interface SearchFiltersProps {
  onFilterChange?: (filters: FilterState) => void;
}

export function SearchFilters({ onFilterChange }: SearchFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    city: 'lahore',
    hostelType: 'girls',
    priceMin: 15000,
    priceMax: 45000,
    amenities: ['3-meals', 'wifi'],
  });

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange?.(updated);
  };

  const amenityOptions = [
    { id: 'ac', label: 'AC Rooms' },
    { id: '3-meals', label: '3 Meals Included' },
    { id: 'wifi', label: 'High-speed WiFi' },
    { id: 'washroom', label: 'Attached Washroom' },
  ];

  return (
    <aside className="w-full lg:w-[280px] shrink-0">
      <div className="bg-bg-card rounded-lg border border-border-default shadow-sm p-space-5 sticky top-[88px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-space-5 pb-space-3 border-b border-border-default">
          <h2 className="font-h3 text-[1.125rem] font-semibold text-text-heading">Filters</h2>
          <button className="text-action font-label text-label hover:underline">Clear all</button>
        </div>

        <div className="space-y-space-6">
          {/* City Dropdown */}
          <div>
            <label className="block font-label text-label text-text-heading mb-space-2">
              City
            </label>
            <div className="relative">
              <select
                value={filters.city}
                onChange={(e) => handleFilterChange({ city: e.target.value })}
                className="w-full bg-surface-container-lowest border border-border-default rounded text-body-default text-text-body h-[42px] px-space-3 appearance-none focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-colors"
              >
                <option value="lahore">Lahore</option>
                <option value="islamabad">Islamabad</option>
                <option value="karachi">Karachi</option>
              </select>
              <ChevronDown className="absolute right-space-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
          </div>

          {/* Hostel Type Radio */}
          <div>
            <label className="block font-label text-label text-text-heading mb-space-3">
              Hostel Type
            </label>
            <div className="space-y-space-2">
              {[
                { value: 'boys', label: 'Boys' },
                { value: 'girls', label: 'Girls' },
                { value: 'mixed', label: 'Mixed / Professional' },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-space-3 cursor-pointer group">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      filters.hostelType === option.value
                        ? 'border-primary-container bg-white'
                        : 'border-border-strong group-hover:border-primary-container'
                    }`}
                  >
                    {filters.hostelType === option.value && (
                      <div className="w-2 h-2 rounded-full bg-primary-container" />
                    )}
                  </div>
                  <span
                    className={`font-body-default text-body-default ${
                      filters.hostelType === option.value
                        ? 'text-text-heading font-medium'
                        : 'text-text-body'
                    }`}
                  >
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block font-label text-label text-text-heading mb-space-3">
              Monthly Rent (PKR)
            </label>
            <div className="flex items-center gap-space-2 mb-space-4">
              <div className="flex-1 bg-surface-container-lowest border border-border-default rounded p-space-2">
                <span className="font-overline text-overline text-text-muted block">MIN</span>
                <span className="font-body-default text-body-default text-text-heading">
                  {filters.priceMin.toLocaleString()}
                </span>
              </div>
              <span className="text-border-strong">-</span>
              <div className="flex-1 bg-surface-container-lowest border border-border-default rounded p-space-2">
                <span className="font-overline text-overline text-text-muted block">MAX</span>
                <span className="font-body-default text-body-default text-text-heading">
                  {filters.priceMax.toLocaleString()}
                </span>
              </div>
            </div>
            {/* Slider Visual */}
            <div className="w-full h-1 bg-surface-container rounded-full relative mt-space-2">
              <div
                className="absolute left-[20%] right-[30%] h-full bg-primary-container rounded-full"
                style={{
                  left: `${(filters.priceMin / 100000) * 100}%`,
                  right: `${100 - (filters.priceMax / 100000) * 100}%`,
                }}
              />
              <button className="absolute left-[20%] top-1/2 -translate-y-1/2 w-4 h-4 bg-bg-card border-2 border-primary-container rounded-full shadow-sm cursor-grab" />
              <button className="absolute right-[30%] top-1/2 -translate-y-1/2 w-4 h-4 bg-bg-card border-2 border-primary-container rounded-full shadow-sm cursor-grab" />
            </div>
          </div>

          {/* Amenities Checklist */}
          <div>
            <label className="block font-label text-label text-text-heading mb-space-3">
              Amenities
            </label>
            <div className="space-y-space-3">
              {amenityOptions.map((amenity) => (
                <label key={amenity.id} className="flex items-center gap-space-3 cursor-pointer group">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      filters.amenities.includes(amenity.id)
                        ? 'border-primary-container bg-primary-container'
                        : 'border-border-strong bg-surface-container-lowest group-hover:border-primary-container'
                    }`}
                  >
                    {filters.amenities.includes(amenity.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span
                    className={`font-body-default text-body-default ${
                      filters.amenities.includes(amenity.id)
                        ? 'text-text-heading font-medium'
                        : 'text-text-body'
                    }`}
                  >
                    {amenity.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
