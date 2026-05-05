'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { BasicInfoForm, type BasicInfoData } from '@/components/onboarding/basic-info-form';
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress';

export default function OnboardingStep2Page() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 5;
  const currentStep = 2;
  const progressPercent = (currentStep / totalSteps) * 100;

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async (data: BasicInfoData) => {
    setIsLoading(true);
    setError('');

    try {
      // Replace with actual API call
      const response = await fetch('/api/onboarding/step-2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save information');
      }

      // Move to next step
      router.push('/onboarding/step-3');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="w-full max-w-2xl bg-bg-card rounded-xl shadow-elevated overflow-hidden border border-border-default/50">
      {/* Header & Progress */}
      <div className="px-space-6 py-space-6 sm:px-space-8 border-b border-border-default/30 bg-surface-container-lowest">
        {/* Top Bar: Logo + Step */}
        <div className="flex items-center justify-between mb-space-4">
          <Link href="/" className="text-primary font-bold text-xl tracking-tight">
            HostelPak
          </Link>
          <div className="text-text-muted font-label text-label">
            Step {currentStep} of {totalSteps}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-surface-container-highest rounded-full h-2 mb-space-6">
          <div
            className="bg-primary-container h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Heading */}
        <h1 className="font-h2 text-h2 text-text-heading mb-space-2">Basic Information</h1>
        <p className="font-body-default text-body-default text-text-muted">
          Let's start with the essential details about your property.
        </p>
      </div>

      {/* Form Content */}
      <div className="px-space-6 py-space-8 sm:px-space-8 bg-bg-card">
        <BasicInfoForm onSubmit={handleSubmit} isLoading={isLoading} error={error} />
      </div>

      {/* Footer Actions */}
      <div className="px-space-6 py-space-5 sm:px-space-8 border-t border-border-default/30 bg-surface-container-lowest flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={isLoading}
          className="px-space-6 py-space-2 rounded-DEFAULT font-label text-label text-text-heading border border-border-strong hover:bg-bg-raised disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary-container outline-none h-[42px]"
          type="button"
        >
          Back
        </button>
        <button
          onClick={() => document.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true }))}
          disabled={isLoading}
          className="px-space-8 py-space-2 rounded-DEFAULT font-label text-label text-on-primary bg-action hover:bg-action-pressed disabled:bg-text-muted active:scale-97 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-action outline-none shadow-minimal h-[42px] disabled:cursor-not-allowed"
          type="button"
        >
          {isLoading ? 'Saving...' : 'Next Step'}
        </button>
      </div>
    </main>
  );
}
