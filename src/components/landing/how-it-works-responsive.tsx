'use client';

import { Search, MessageCircle, CheckCircle } from 'lucide-react';

interface HowItWorksStep {
  number: number;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

const DEFAULT_STEPS: HowItWorksStep[] = [
  {
    number: 1,
    title: 'Find',
    description: 'Search our curated list of verified properties in your desired city and neighborhood.',
    icon: <Search className="w-6 h-6" strokeWidth={1.5} />,
  },
  {
    number: 2,
    title: 'Contact',
    description: 'Connect directly with hostel owners through our secure platform to ask questions.',
    icon: <MessageCircle className="w-6 h-6" strokeWidth={1.5} />,
  },
  {
    number: 3,
    title: 'Book',
    description: 'Secure your room with confidence. No hidden fees, just straightforward student housing.',
    icon: <CheckCircle className="w-6 h-6" strokeWidth={1.5} />,
  },
];

interface HowItWorksResponsiveProps {
  steps?: HowItWorksStep[];
}

export function HowItWorksResponsive({ steps = DEFAULT_STEPS }: HowItWorksResponsiveProps) {
  return (
    <section className="max-w-[1280px] mx-auto px-space-4 md:px-space-8 py-space-16 md:py-space-24">
      <h2 className="font-h2 text-h2 text-text-heading mb-space-12 text-center">How it works</h2>

      {/* Grid: 1-col mobile → 3-col desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-8 md:gap-space-12">
        {steps.map((step) => (
          <div key={step.number} className="flex flex-col items-center text-center">
            {/* Large Number */}
            <div className="font-display text-[3rem] md:text-[4rem] font-black text-primary-container leading-none mb-space-4 opacity-80">
              {step.number}
            </div>

            {/* Title */}
            <h3 className="font-h3 text-h3 text-text-heading mb-space-2">{step.title}</h3>

            {/* Description */}
            <p className="font-body-default text-body-default text-on-surface-variant">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
