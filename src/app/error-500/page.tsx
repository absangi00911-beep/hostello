import { Metadata } from 'next';
import ErrorPage500Responsive from '@/components/error/error-page-500-responsive';

export const metadata: Metadata = {
  title: '500 Internal Server Error | HostelLo',
  description: 'An internal server error has occurred. Please try again later.',
};

export default function Error500Page() {
  return <ErrorPage500Responsive />;
}
