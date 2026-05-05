'use client';

import { useState } from 'react';
import { TopNav } from '@/components/layout/top-nav';
import { Footer } from '@/components/layout/footer';
import { SearchFilters } from './search-filters';
import { SearchResultsGrid } from './search-results-grid';

interface FilterState {
  city: string;
  hostelType: 'boys' | 'girls' | 'mixed';
  priceMin: number;
  priceMax: number;
  amenities: string[];
}

// Mock data - replace with actual API calls
const MOCK_HOSTELS = [
  {
    id: '1',
    name: "The Scholar's Den",
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDuu_bmcLDfuASH3nkJPtc_6EG9ATOY6KzX5EYM1zscxmvkRPMObaqGRd1iBEfoSIp83cRroDFO7pImnmEUDaC5Jc4q583xkNJfb2VNJLzSvqzA0-E4Evo47aC5862EbNZ146KOMwb_nwDe1r-rEb6munHV66jodOpy-5bUQ5j2wkMrqGNLtUN-v5qRYaIQKskM5Na8ZS0JiErdum3bOgN2P6Ln6ukvz3OX-VHz-K1ci-4FgiCfKapZz-Ps6t6C5EGkhKwbmgDOfGvf',
    verified: true,
    rating: 4.9,
    reviewCount: 128,
    location: 'Johar Town, near UCP',
    amenities: [
      { icon: '👩', label: 'Girls Only', color: '#2A6545' },
      { icon: '❄️', label: 'AC', color: '#7A5308' },
      { icon: '🚶', label: '5 min walk', color: '#3B6E9E' },
    ],
    price: 22000,
  },
  {
    id: '2',
    name: 'Crescent Girls Residency',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJW5exuVqgeTAuhUQxF3hcQpsp-akGXJheScKSSTpS_3KflealDT6go9PaXSMYxVCTLhN45RdaPTIP948t_ZOdCWitxGxVdlrwtOEIiU4iYv2f0q7svo1ErTQXl86rAKWEZJHFhjbn0Ma_95YpZYO3TO43XFFQYgyv6JLLgMvLg_4U2gm84DjCtG9i9DzHuYqxkXZmrFASXC-taNSqNYY9oli8KW9Uzx0fX-UyKnuqucmlwuEQ0YmBp6fDiwmeZznmRHjLVhiKQ1G0',
    verified: false,
    rating: 4.7,
    reviewCount: 84,
    location: 'Model Town, Block C',
    amenities: [
      { icon: '👩', label: 'Girls Only', color: '#2A6545' },
      { icon: '🍽️', label: 'Meals Inc.', color: '#7A5308' },
    ],
    price: 28000,
  },
  {
    id: '3',
    name: 'Premier Female Lodge',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGoAsjEVl1p_DXClMdEBL12CjVndwSJw2pSZnvK9r720ktexOPOyUBC0VDIV-Y0KKmX6082azpBoLttsU12ZOh7NpAt2ODiKg_SZW-Y_fKec0mS2KT4sgVFb-P1WdAem2Y0OovuqkcxU1jdG8Wen-WfDVnazgREJBbN3jzELryGJFqKtOi7PyT7enz0QIt14gfPRcLlvM0BCPgNhJdQrZfIml88MmL90WLrNcjVOYKv5PQ-VXwAqQz4K4lpgo85wQTmZHZcKmAr98y',
    verified: true,
    rating: 4.5,
    reviewCount: 42,
    location: 'Gulberg III, near Liberty',
    amenities: [
      { icon: '👩', label: 'Girls Only', color: '#2A6545' },
      { icon: '❄️', label: 'AC', color: '#7A5308' },
      { icon: '🔒', label: '24/7 Guards', color: '#2A7A50' },
    ],
    price: 32000,
  },
  {
    id: '4',
    name: 'Elite Student Accommodation',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDu6ngDCLchawrJY0vNbF3PH-tMJshYM06YoBFjjtl_-DYhs9w42NWf-wFGanovPBIHXec7pYYgkbK_hY2hLJ-RdiqCF7MbkAqw0nL2WgWqIfkEf3QWieIIhog-QGANZ6IZKIjYQxxRMe2slo1rIToaTrLVXcIQjJtzLpIWkHeZyZFwP5fvogPUUQtmWD-m1SLMrwOGpHz30O0u7ZZgTvQRnAPqZ_gdJqSoo4IA_FPOwjqMXb92N84bxp9fNpG_vzBrbaq3xuPj0GuP',
    verified: false,
    rating: 4.2,
    reviewCount: 19,
    location: 'Faisal Town, Block A',
    amenities: [
      { icon: '👩', label: 'Girls Only', color: '#2A6545' },
      { icon: '📡', label: 'High-Speed WiFi', color: '#3B6E9E' },
    ],
    price: 19500,
  },
];

export function SearchPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    city: 'lahore',
    hostelType: 'girls',
    priceMin: 15000,
    priceMax: 45000,
    amenities: ['3-meals', 'wifi'],
  });

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleCardClick = (hostelId: string) => {
    // Navigate to hostel detail page
    window.location.href = `/hostels/${hostelId}`;
  };

  return (
    <div className="bg-bg-page font-body-default text-text-body min-h-screen flex flex-col antialiased">
      <TopNav />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-space-4 md:px-space-8 py-space-6 md:py-space-8 flex flex-col lg:flex-row gap-space-6 lg:gap-space-8">
        <SearchFilters onFilterChange={handleFilterChange} />

        <SearchResultsGrid
          hostels={MOCK_HOSTELS}
          totalCount={23}
          city={filters.city}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onCardClick={handleCardClick}
        />
      </main>

      <Footer />
    </div>
  );
}
