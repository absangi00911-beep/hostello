import { Metadata } from 'next';
import ReviewSubmitFullPageResponsive from '@/components/reviews/review-submit-full-page-responsive';

export const metadata: Metadata = {
  title: 'Write Review | HostelHub',
  description: 'Write and submit a review for your hostel stay. Share your experience with other travelers.',
};

export default function ReviewSubmitFullPage() {
  return <ReviewSubmitFullPageResponsive />;
}
