import { Metadata } from 'next';
import SearchResultsMapResponsive from '@/components/search/search-results-map-responsive';

export const metadata: Metadata = {
  title: 'Search Results - Map View | HostelHub',
  description: 'Browse hostel search results with interactive map view. Filter by price, amenities, and ratings.',
};

export default function SearchResultsMapPage() {
  return <SearchResultsMapResponsive />;
}
