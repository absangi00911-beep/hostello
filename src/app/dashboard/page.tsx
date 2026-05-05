import { StudentDashboardResponsive } from '@/components/dashboard/student-dashboard-responsive';

export const metadata = {
  title: 'My Dashboard - HostelLo',
  description: 'Manage your hostel bookings, saved properties, and messages.',
};

export default function StudentDashboardPage() {
  const handleViewDetails = (bookingId: string) => {
    console.log('View details for booking:', bookingId);
    // Navigate to booking details page
  };

  const handleContactHost = (bookingId: string) => {
    console.log('Contact host for booking:', bookingId);
    // Open contact modal or navigate to messaging
  };

  const handleLeaveReview = (bookingId: string) => {
    console.log('Leave review for booking:', bookingId);
    // Navigate to review page
  };

  return (
    <StudentDashboardResponsive
      onViewDetails={handleViewDetails}
      onContactHost={handleContactHost}
      onLeaveReview={handleLeaveReview}
    />
  );
}
