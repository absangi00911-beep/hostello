import { AddListingPhotosResponsive } from '@/components/onboarding/add-listing-photos-responsive';

export const metadata = {
  title: 'Add Listing - Photos | HostelLo',
  description: 'Upload high-quality photos of your hostel to attract more bookings.',
};

export default function OnboardingStep4Page() {
  return (
    <AddListingPhotosResponsive
      currentStep={4}
      totalSteps={5}
      onBack={() => {
        // Navigate back to step 3
      }}
      onNext={async (photos) => {
        // Submit photos and navigate to step 5
        console.log('Photos submitted:', photos);
      }}
      onExit={() => {
        // Navigate to dashboard
      }}
    />
  );
}
