import { Metadata } from 'next';
import SubmitReviewResponsive from '@/components/reviews/submit-review-responsive';

export const metadata: Metadata = {
  title: 'Submit Review | HostelHub',
  description:
    'Share your hostel experience. Rate your stay and write a detailed review to help other travelers.',
};

export default function SubmitReviewPage() {
  return <SubmitReviewResponsive />;
}
