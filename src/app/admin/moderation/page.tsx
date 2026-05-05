import { AdminListingModerationResponsive } from '@/components/admin/admin-listing-moderation-responsive';

export const metadata = {
  title: 'Listing Moderation | HostelLo Admin',
  description: 'Review and manage hostel submissions in the admin console.',
};

export default function AdminModerationPage() {
  return (
    <AdminListingModerationResponsive
      pendingCount={12}
      onApprove={(id) => {
        console.log('Approve listing:', id);
      }}
      onSuspend={(id) => {
        console.log('Suspend listing:', id);
      }}
      onSearch={(query) => {
        console.log('Search:', query);
      }}
      onTabChange={(tab) => {
        console.log('Tab changed to:', tab);
      }}
    />
  );
}
