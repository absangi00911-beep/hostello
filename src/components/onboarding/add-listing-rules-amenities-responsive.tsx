'use client';

import { FormEvent, useState } from 'react';
import { ArrowLeft, Wifi, Wind, Shirt, ChefHat, Lock, Trees, ArrowRight } from 'lucide-react';

interface Amenity {
  id: string;
  label: string;
  icon: string;
  selected: boolean;
}

interface AddListingRulesAmenitiesResponsiveProps {
  currentStep?: number;
  totalSteps?: number;
  initialAmenities?: Amenity[];
  initialRules?: string;
  onBack?: () => void;
  onSubmit?: (amenities: Amenity[], rules: string) => void;
  onBackToLocation?: () => void;
}

const DEFAULT_AMENITIES: Amenity[] = [
  { id: 'wifi', label: 'Free High-Speed WiFi', icon: 'wifi', selected: false },
  { id: 'ac', label: 'Air Conditioning', icon: 'ac_unit', selected: true },
  { id: 'laundry', label: 'Laundry Facilities', icon: 'local_laundry_service', selected: true },
  { id: 'kitchen', label: 'Shared Kitchen', icon: 'kitchen', selected: false },
  { id: 'lockers', label: 'Secure Lockers', icon: 'lock', selected: false },
  { id: 'terrace', label: 'Rooftop Terrace', icon: 'deck', selected: false },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  wifi: <Wifi className="w-5 h-5" />,
  ac_unit: <Wind className="w-5 h-5" />,
  local_laundry_service: <Shirt className="w-5 h-5" />,
  kitchen: <ChefHat className="w-5 h-5" />,
  lock: <Lock className="w-5 h-5" />,
  deck: <Trees className="w-5 h-5" />,
};

export function AddListingRulesAmenitiesResponsive({
  currentStep = 5,
  totalSteps = 5,
  initialAmenities = DEFAULT_AMENITIES,
  initialRules = 'No smoking inside the premises.\nQuiet hours after 11 PM.\nCheck-out is strictly at 10 AM.',
  onBack,
  onSubmit,
  onBackToLocation,
}: AddListingRulesAmenitiesResponsiveProps) {
  const [amenities, setAmenities] = useState<Amenity[]>(initialAmenities);
  const [rules, setRules] = useState(initialRules);
  const [loading, setLoading] = useState(false);

  const handleToggleAmenity = (id: string) => {
    setAmenities(amenities.map((a) => (a.id === id ? { ...a, selected: !a.selected } : a)));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!rules.trim()) {
      alert('Please enter at least one house rule');
      return;
    }

    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(amenities, rules);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-page text-text-body font-body-default min-h-screen flex flex-col antialiased">
      {/* TopNavBar */}
      <nav className="bg-bg-card border-b border-stone-200 shadow-sm shadow-amber-900/5 h-16 flex justify-between items-center px-space-6 w-full z-40">
        <div className="flex items-center gap-space-4">
          <span className="text-xl font-bold tracking-tight text-stone-900 font-h3">HostelLo</span>
          <div className="hidden md:flex gap-space-6 ml-space-8" />
        </div>
        <div className="flex items-center gap-space-4">
          <button className="text-stone-600 hover:bg-amber-50 transition-colors p-space-2 rounded-full scale-95 active:opacity-80 transition-transform duration-150">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button className="text-stone-600 hover:bg-amber-50 transition-colors p-space-2 rounded-full scale-95 active:opacity-80 transition-transform duration-150">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button className="bg-action text-on-primary font-label text-label px-space-4 py-space-2 rounded-DEFAULT hover:bg-action-pressed transition-colors shadow-sm">
            Add Listing
          </button>
          <img
            alt="Owner Profile"
            className="w-8 h-8 rounded-full border border-border-default object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-pulyePbBjmNafpN7yF4piNEichVNwUbYWruY36_WEsYKgpZhWfvmB_63iVP9bDjHlfQPXYPiBc9VOd258yTXzlgk6chiIwPV5QKmyVaO3Uh3zOQfknNsRt1n20Fc73dJvR6vfUmYqDwxFwgzdP1S_8U70-SsuNKYBVwxXTstpXqCda_KoaT4m4DK46VJp2nNKNP3cEEEXzZ1kXS-uPdloYZgh7YOUffa2dk6fTbT1Z-RvhyHjLzonSA-L4nv0wbp6AiCfKSqMeZe"
          />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-[1280px] mx-auto px-space-4 sm:px-space-6 lg:px-space-8 py-space-8 md:py-space-12">
        <div className="max-w-3xl mx-auto">
          {/* Form Header & Progress */}
          <div className="mb-space-8">
            <button
              onClick={onBackToLocation}
              className="flex items-center gap-space-2 text-text-muted font-label text-label mb-space-2 hover:text-text-heading transition-colors"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
              <span>Back to Location</span>
            </button>
            <h1 className="font-h1 text-h1 text-text-heading mb-space-4">Rules & Amenities</h1>

            {/* Progress Bar */}
            <div className="flex items-center gap-space-2 mb-space-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${i < currentStep ? 'bg-primary-container' : 'bg-primary'}`}
                />
              ))}
            </div>
            <p className="font-overline text-overline text-text-muted text-right">
              Step {currentStep} of {totalSteps}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-space-6">
            {/* Amenities Section */}
            <div className="bg-bg-card rounded-xl border border-border-default shadow-sm p-space-6 sm:p-space-8">
              <div className="mb-space-6">
                <h2 className="font-h3 text-h3 text-text-heading">Select Amenities</h2>
                <p className="font-body-default text-body-default text-text-muted">
                  Highlight what your hostel offers to attract more guests.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-4">
                {amenities.map((amenity) => (
                  <label
                    key={amenity.id}
                    className="flex items-center p-space-3 rounded-lg border border-border-default hover:bg-bg-raised hover:-translate-y-[1px] transition-all cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={amenity.selected}
                      onChange={() => handleToggleAmenity(amenity.id)}
                      className="rounded border-outline-variant text-action focus:ring-action focus:ring-offset-0 w-5 h-5 mr-space-3"
                    />
                    <span
                      className={`mr-space-2 text-[20px] ${amenity.selected ? 'text-action' : 'text-text-muted'}`}
                    >
                      {ICON_MAP[amenity.icon] || <span className="material-symbols-outlined">{amenity.icon}</span>}
                    </span>
                    <span className="font-label text-label text-text-heading">{amenity.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* House Rules Section */}
            <div className="bg-bg-card rounded-xl border border-border-default shadow-sm p-space-6 sm:p-space-8">
              <div className="mb-space-6">
                <h2 className="font-h3 text-h3 text-text-heading">House Rules</h2>
                <p className="font-body-default text-body-default text-text-muted">
                  Set clear expectations. Enter one rule per line.
                </p>
              </div>

              <div className="flex flex-col gap-space-2">
                <label htmlFor="house-rules" className="sr-only">
                  House Rules List
                </label>
                <textarea
                  id="house-rules"
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  placeholder="E.g., No smoking inside the premises.
Quiet hours after 11 PM.
Check-out is strictly at 10 AM."
                  className="w-full rounded-lg border border-border-default bg-surface-container-lowest text-text-body font-body-default focus:border-primary focus:ring-1 focus:ring-primary shadow-sm resize-y p-space-3"
                  rows={6}
                />
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-space-4 pt-space-4 border-t border-border-default mt-space-8">
              <button
                type="button"
                onClick={onBack}
                className="w-full sm:w-auto px-space-6 py-space-3 rounded-lg border border-border-default bg-surface-container-lowest text-text-heading font-label text-label hover:bg-bg-raised hover:-translate-y-[1px] transition-all shadow-sm"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-space-8 py-space-3 rounded-lg bg-action text-on-primary font-label text-label hover:bg-action-pressed active:scale-97 hover:-translate-y-[1px] transition-all shadow-sm focus:ring-2 focus:ring-action focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-space-2"
              >
                {loading ? 'Submitting...' : 'Submit for Review'}
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
