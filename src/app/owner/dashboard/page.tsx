import { OwnerDashboardResponsive } from '@/components/owner/owner-dashboard-responsive';

export const metadata = {
  title: 'Owner Dashboard | HostelLo',
  description: 'Manage your hostels, bookings, and guest requests from your partner dashboard.',
};

export default function OwnerDashboardPage() {
  return (
    <div>
      <OwnerDashboardResponsive
        ownerName="Property Manager"
        isVerified={true}
        stats={{
          listings: 3,
          activeBookings: 12,
          pendingRequests: 5,
          monthlyInquiries: 48,
        }}
      />
    </div>
  );
}
