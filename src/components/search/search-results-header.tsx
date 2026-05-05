'use client';

import { useState } from 'react';
import { ArrowUpDown } from 'lucide-react';

type SortOption = 'recommended' | 'price-low' | 'price-high' | 'rated';

interface SearchResultsHeaderProps {
  count: number;
  city: string;
  onSortChange?: (sort: SortOption) => void;
}

export function SearchResultsHeader({
  count,
  city,
  onSortChange,
}: SearchResultsHeaderProps) {
  const [sortBy, setSortBy] = useState<SortOption>('recommended');

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    onSortChange?.(value);
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-space-4 pb-space-4 border-b border-border-default">
      <h1 className="font-h2 text-[1.75rem] text-text-heading">
        {count} hostels in {city}
      </h1>

      <div className="flex items-center gap-space-3">
        <span className="font-label text-label text-text-muted hidden sm:inline">Sort by:</span>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="bg-surface-container-lowest border border-border-default rounded text-body-default text-text-heading font-medium h-[42px] pl-space-3 pr-space-8 appearance-none focus:border-primary-container focus:ring-1 focus:ring-primary-container outline-none transition-colors cursor-pointer"
          >
            <option value="recommended">Recommended</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rated">Highest Rated</option>
          </select>
          <ArrowUpDown className="absolute right-space-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-heading pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
