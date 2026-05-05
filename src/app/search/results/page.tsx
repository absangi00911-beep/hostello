import { Metadata } from 'next';
import SearchResultsResponsive from '@/components/search/search-results-responsive';

export const metadata: Metadata = {
  title: 'Search Results | HostelHub',
  description: 'Browse hostel search results with filters and interactive map view.',
};

export default function SearchResultsPage() {
  return <SearchResultsResponsive />;
}
