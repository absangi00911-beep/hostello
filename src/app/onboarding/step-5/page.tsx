import { AddListingRulesAmenitiesResponsive } from '@/components/onboarding/add-listing-rules-amenities-responsive';

export const metadata = {
  title: 'Add Listing - Rules & Amenities | HostelLo',
  description: 'Set house rules and select amenities for your hostel listing.',
};

export default function OnboardingStep5Page() {
  return (
    <AddListingRulesAmenitiesResponsive
      currentStep={5}
      totalSteps={5}
      onBack={() => {
        // Navigate back to step 4
      }}
      onSubmit={async (amenities, rules) => {
        // Submit final listing
        console.log('Listing submitted:', { amenities, rules });
      }}
      onBackToLocation={() => {
        // Navigate back to location/step 2
      }}
    />
  );
}
