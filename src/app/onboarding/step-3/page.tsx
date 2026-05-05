import { AddListingRoomsResponsive } from '@/components/onboarding/add-listing-rooms-responsive';

export const metadata = {
  title: 'Add Listing - Room Inventory | HostelLo',
  description: 'Define your room types, capacity, and monthly rates for your hostel listing.',
};

export default function OnboardingStep3Page() {
  return (
    <AddListingRoomsResponsive
      currentStep={3}
      totalSteps={5}
      onBack={() => {
        // Navigate back to step 2
      }}
      onNext={async (rooms) => {
        // Submit rooms and navigate to step 4
        console.log('Rooms submitted:', rooms);
      }}
      onClose={() => {
        // Navigate to dashboard
      }}
    />
  );
}
