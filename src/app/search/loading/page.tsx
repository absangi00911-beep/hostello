import { Metadata } from 'next';
import SearchLoadingSkeletonResponsive from '@/components/search/search-loading-skeleton-responsive';

export const metadata: Metadata = {
  title: 'HostelPak Search - Loading',
  description: 'Loading hostel search results...',
};

export default function SearchLoadingPage() {
  return <SearchLoadingSkeletonResponsive />;
}
