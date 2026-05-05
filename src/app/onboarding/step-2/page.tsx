'use client';

import { useRouter } from 'next/navigation';
import { OwnerBasicInfoFormResponsive } from '@/components/onboarding/owner-basic-info-form-responsive';

interface FormData {
  hostelName: string;
  city: string;
  address: string;
  audience: 'mixed' | 'female' | 'male';
}

export default function OnboardingStep2Page() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async (data: FormData) => {
    try {
      // Make API call to save basic info
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
      console.error('Submit error:', err);
      throw err;
    }
  };

  const handleClose = () => {
    router.push('/onboarding/step-1');
  };

  return (
    <OwnerBasicInfoFormResponsive
      onBack={handleBack}
      onNext={handleSubmit}
      onClose={handleClose}
    />
  );
}
