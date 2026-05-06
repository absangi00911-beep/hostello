'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Building } from 'lucide-react';

interface OwnerOnboardingWelcomeResponsiveProps {
  currentStep?: number;
  totalSteps?: number;
  onBack?: () => void;
  onNext?: () => void;
}

export function OwnerOnboardingWelcomeResponsive({
  currentStep = 1,
  totalSteps = 5,
  onBack,
  onNext,
}: OwnerOnboardingWelcomeResponsiveProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNext = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onNext?.();
      setIsAnimating(false);
    }, 300);
  };

  // Generate progress items
  const progressItems = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="bg-bg-page text-on-surface font-body-default min-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative Background Circles - Mobile */}
      <div className="md:hidden absolute top-0 right-0 w-64 h-64 bg-primary-faint rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
      <div className="md:hidden absolute bottom-0 left-0 w-48 h-48 bg-bg-raised rounded-full mix-blend-multiply filter blur-2xl opacity-70 translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-center p-space-6 md:p-space-12 max-w-7xl mx-auto w-full relative z-10">
        {/* Progress Indicator - Mobile: Dots */}
        <header className="md:hidden flex justify-center items-center gap-space-2 mb-12">
          {progressItems.map((item) => (
            <div
              key={item}
              className={`rounded-full transition-all duration-300 ${
                item === currentStep
                  ? 'w-2.5 h-2.5 bg-primary-container shadow-sm'
                  : 'w-2 h-2 bg-surface-variant'
              }`}
            ></div>
          ))}
        </header>

        {/* Progress Indicator - Desktop: Bars */}
        <div className="hidden md:flex absolute top-space-12 left-0 w-full justify-center px-space-6 z-20">
          <div className="flex items-center gap-space-2">
            {progressItems.map((item) => (
              <div
                key={item}
                className={`h-2 w-12 rounded-full transition-all duration-300 ${
                  item <= currentStep ? 'bg-primary-container' : 'bg-border-default'
                }`}
              ></div>
            ))}
          </div>
        </div>

        {/* Content Grid - Mobile: Single Column, Desktop: 2 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-12 md:gap-space-24 items-center w-full mt-space-16 md:mt-space-24">
          {/* Left Side: Typography & Content */}
          <div className="flex flex-col items-center md:items-start gap-space-6">
            <h1 className="font-h1 text-h1 text-text-heading text-center md:text-left">
              Ready to list your hostel?
            </h1>
            <p className="font-body-lg text-body-lg text-text-muted max-w-md text-center md:text-left">
              Join thousands of verified owners connecting with students in need of secure, comfortable housing.
              We'll guide you through setting up your property details, pricing, and availability.
            </p>
          </div>

          {/* Right Side: Visual - Hidden on Mobile, Visible on Desktop */}
          <div className="hidden md:flex justify-center items-center">
            <div className="w-full max-w-sm aspect-square bg-bg-raised rounded-xl shadow-sm flex items-center justify-center p-space-8 border border-border-default relative overflow-hidden">
              {/* Icon */}
              <Building className="w-[120px] h-[120px] text-primary-container z-10" strokeWidth={1} />

              {/* Decorative Circles */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-faint rounded-full opacity-50"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary-light rounded-full opacity-30"></div>
            </div>
          </div>

          {/* Mobile: Icon Below Text */}
          <div className="md:hidden flex justify-center mt-space-4">
            <div
              className={`w-20 h-20 bg-bg-card rounded-2xl shadow-[0_4px_12px_rgba(194,139,26,0.08)] border border-surface-variant flex items-center justify-center transition-transform duration-500 ${
                isAnimating ? 'scale-110' : 'hover:rotate-0'
              }`}
              style={{ transform: isAnimating ? 'scale(1.1)' : 'rotate(-3deg)' }}
            >
              <Building className="w-10 h-10 text-primary-container" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <div className="w-full bg-bg-card border-t border-border-default p-space-4 md:px-space-8 md:py-space-6 sticky bottom-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button
            className="font-label text-label text-text-muted hover:text-text-heading transition-colors flex items-center gap-space-2 px-space-4 py-space-3"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft className="w-5 h-5 hidden md:block" strokeWidth={1.5} />
            Back
          </button>
          <button
            className="bg-primary-container text-on-primary font-label text-label px-space-6 md:px-space-8 py-space-3 rounded-lg shadow-sm hover:shadow-md hover:scale-[0.98] transition-all active:scale-95 flex items-center gap-space-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isAnimating}
            onClick={handleNext}
            type="button"
          >
            Next
            <ArrowRight className="w-5 h-5 hidden md:block" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
