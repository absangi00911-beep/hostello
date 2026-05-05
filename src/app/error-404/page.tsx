import { Metadata } from 'next';
import ErrorPage404Responsive from '@/components/error/error-page-404-responsive';

export const metadata: Metadata = {
  title: '404 - Page Not Found | HostelLo',
  description: 'The page you are looking for does not exist. Search for hostels or return to home.',
};

export default function Error404Page() {
  return <ErrorPage404Responsive />;
}
