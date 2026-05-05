'use client';

import { useRouter } from 'next/navigation';
import { ArrowBack, ArrowForward } from 'lucide-react';
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress';
import { OnboardingStep1Content } from '@/components/onboarding/onboarding-step-1-content';

export default function OnboardingStep1Page() {
  const router = useRouter();
  const totalSteps = 5;
  const currentStep = 1;

  const handleBack = () => {
    router.back();
  };

  const handleNext = () => {
    router.push('/onboarding/step-2');
  };

  return (
    <>
      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-center p-space-6 md:p-space-12 max-w-7xl mx-auto w-full relative">
        {/* Progress Indicator */}
        <div className="absolute top-space-6 md:top-space-12 left-0 w-full flex justify-center px-space-6">
          <OnboardingProgress totalSteps={totalSteps} currentStep={currentStep} />
        </div>

        {/* Content */}
        <div className="mt-space-16 md:mt-0">
          <OnboardingStep1Content />
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <div className="w-full bg-bg-card border-t border-border-default p-space-4 md:px-space-8 md:py-space-6 sticky bottom-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="font-label text-label text-text-muted hover:text-text-heading transition-colors flex items-center gap-space-2"
          >
            <ArrowBack className="w-5 h-5" strokeWidth={1.5} />
            Back
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="bg-primary-container text-on-primary font-label text-label px-space-6 py-space-3 rounded-lg shadow-sm hover:scale-[0.97] hover:shadow-md active:scale-95 transition-all flex items-center gap-space-2"
          >
            Next
            <ArrowForward className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </>
  );
}
