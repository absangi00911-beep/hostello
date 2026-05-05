'use client';

import { Search, MessageCircle, CheckCircle } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    number: 1,
    title: 'Search & Filter',
    description:
      'Find the perfect location near your campus with exact pricing and verified photos.',
    icon: <Search className="w-6 h-6" />,
  },
  {
    number: 2,
    title: 'Contact Directly',
    description:
      'Message the owner directly through our secure platform to ask questions or arrange a visit.',
    icon: <MessageCircle className="w-6 h-6" />,
  },
  {
    number: 3,
    title: 'Book Securely',
    description:
      'Reserve your bed with confidence knowing the property has passed our verification process.',
    icon: <CheckCircle className="w-6 h-6" />,
  },
];

export function HowItWorks() {
  return (
    <section className="px-4 py-12 bg-surface-container-low rounded-2xl mx-4 my-8 border border-border-default">
      <h2 className="font-h2 text-h2 text-text-heading mb-8">How it works</h2>

      <div className="flex flex-col gap-8">
        {STEPS.map((step) => (
          <div key={step.number} className="flex gap-4">
            {/* Numbered Circle */}
            <div className="w-10 h-10 rounded-full bg-primary-faint text-primary flex items-center justify-center font-bold text-h3 shrink-0 border border-border-default">
              {step.number}
            </div>

            {/* Content */}
            <div>
              <h3 className="font-h3 text-h3 text-text-heading mb-1">{step.title}</h3>
              <p className="font-body-default text-body-default text-text-muted">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
