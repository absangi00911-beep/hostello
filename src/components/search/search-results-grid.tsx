'use client';

import { HostelCard } from './hostel-card';
import { Pagination } from './pagination';
import { SearchResultsHeader } from './search-results-header';

interface Hostel {
  id: string;
  name: string;
  image: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  location: string;
  amenities: Array<{ icon: string; label: string; color: string }>;
  price: number;
}

interface SearchResultsGridProps {
  hostels: Hostel[];
  totalCount: number;
  city: string;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onSortChange?: (sort: string) => void;
  onCardClick?: (hostelId: string) => void;
}

export function SearchResultsGrid({
  hostels,
  totalCount,
  city,
  currentPage = 1,
  onPageChange,
  onSortChange,
  onCardClick,
}: SearchResultsGridProps) {
  return (
    <section className="flex-1 flex flex-col gap-space-6">
      {/* Results Header */}
      <SearchResultsHeader
        count={totalCount}
        city={city}
        onSortChange={onSortChange}
      />

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-6">
        {hostels.map((hostel) => (
          <HostelCard
            key={hostel.id}
            {...hostel}
            onCardClick={() => onCardClick?.(hostel.id)}
          />
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalCount / 4)}
        onPageChange={onPageChange}
      />
    </section>
  );
}
