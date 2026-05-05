import { Metadata } from 'next';
import BookingConfirmedResponsive from '@/components/booking/booking-confirmed-responsive';

export const metadata: Metadata = {
  title: 'Booking Confirmed | HostelHub',
  description:
    'Your hostel booking has been confirmed. View your booking details, check-in information, and message the hostel owner.',
};

export default function BookingConfirmedPage() {
  return <BookingConfirmedResponsive />;
}
