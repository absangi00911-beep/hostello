'use client';

import { useRouter } from 'next/navigation';
import { OwnerOnboardingWelcomeResponsive } from '@/components/onboarding/owner-onboarding-welcome-responsive';

export default function OnboardingStep1Page() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleNext = () => {
    router.push('/onboarding/step-2');
  };

  return <OwnerOnboardingWelcomeResponsive currentStep={1} totalSteps={5} onBack={handleBack} onNext={handleNext} />;
}
