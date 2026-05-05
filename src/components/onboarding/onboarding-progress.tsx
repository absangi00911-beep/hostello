'use client';

interface OnboardingProgressProps {
  totalSteps: number;
  currentStep: number;
}

export function OnboardingProgress({ totalSteps, currentStep }: OnboardingProgressProps) {
  return (
    <div className="flex items-center gap-space-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`h-2 w-12 rounded-full transition-colors ${
            index < currentStep ? 'bg-primary-container' : 'bg-border-default'
          }`}
        />
      ))}
    </div>
  );
}
