'use client';

import { Search } from 'lucide-react';

interface HeroSectionProps {
  onSearchClick?: () => void;
}

export function HeroSection({ onSearchClick }: HeroSectionProps) {
  return (
    <section className="px-4 pt-12 pb-8">
      <h1 className="font-display text-display text-text-heading mb-3">
        Secure your<br />
        student stay.
      </h1>
      <p className="font-body-lg text-body-lg text-text-muted mb-8 pr-4">
        Find verified hostels, transparent pricing, and direct owner contact. Built for students who value certainty.
      </p>

      {/* Search Trigger */}
      <button
        onClick={onSearchClick}
        className="w-full bg-bg-card border border-border-strong rounded-xl p-4 flex items-center gap-4 shadow-sm active:bg-bg-raised transition-colors focus:ring-2 focus:ring-primary-container focus:outline-none hover:shadow-md"
      >
        <Search className="w-6 h-6 text-primary-deep flex-shrink-0" />
        <div className="text-left flex-grow">
          <div className="font-label text-label text-text-heading font-semibold">
            Where are you studying?
          </div>
          <div className="font-body-default text-body-default text-text-muted text-sm">
            Search by city or university...
          </div>
        </div>
      </button>
    </section>
  );
}
