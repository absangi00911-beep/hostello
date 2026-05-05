'use client';

import { Building } from 'lucide-react';

export function OnboardingStep1Content() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-space-12 md:gap-space-24 items-center w-full">
      {/* Left Side: Typography & Content */}
      <div className="flex flex-col gap-space-6">
        <h1 className="font-h1 text-h1 text-text-heading">Ready to list your hostel?</h1>
        <p className="font-body-lg text-body-lg text-text-muted max-w-md">
          Join thousands of verified owners connecting with students in need of secure,
          comfortable housing. We'll guide you through setting up your property details,
          pricing, and availability.
        </p>
      </div>

      {/* Right Side: Visual */}
      <div className="flex justify-center items-center">
        <div className="w-full max-w-sm aspect-square bg-bg-raised rounded-xl shadow-sm flex items-center justify-center p-space-8 border border-border-default relative overflow-hidden">
          {/* Icon */}
          <Building className="w-[120px] h-[120px] text-primary-container z-10" strokeWidth={1} />

          {/* Decorative background circles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-faint rounded-full opacity-50" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary-light rounded-full opacity-30" />
        </div>
      </div>
    </div>
  );
}
