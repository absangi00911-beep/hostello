'use client';

import { useState, FormEvent } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface OwnerBasicInfoFormResponsiveProps {
  onBack?: () => void;
  onNext?: (data: FormData) => void;
  onClose?: () => void;
}

interface FormData {
  hostelName: string;
  city: string;
  address: string;
  audience: 'mixed' | 'female' | 'male';
}

const CITIES = [
  { value: 'lahore', label: 'Lahore' },
  { value: 'karachi', label: 'Karachi' },
  { value: 'islamabad', label: 'Islamabad' },
  { value: 'peshawar', label: 'Peshawar' },
  { value: 'multan', label: 'Multan' },
  { value: 'faisalabad', label: 'Faisalabad' },
  { value: 'rawalpindi', label: 'Rawalpindi' },
  { value: 'other', label: 'Other' },
];

export function OwnerBasicInfoFormResponsive({
  onBack,
  onNext,
  onClose,
}: OwnerBasicInfoFormResponsiveProps) {
  const [formData, setFormData] = useState<FormData>({
    hostelName: '',
    city: '',
    address: '',
    audience: 'mixed',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.hostelName.trim()) {
      newErrors.hostelName = 'Hostel name is required';
    }

    if (!formData.city) {
      newErrors.city = 'City is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Street address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (onNext) {
        await onNext(formData);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bg-page text-text-body font-body-default min-h-screen flex flex-col">
      {/* Mobile: Sticky Progress Header */}
      <header className="md:hidden px-space-4 pt-space-4 pb-space-2 bg-bg-page sticky top-0 z-10">
        <div className="flex items-center justify-between mb-space-2">
          <span className="font-overline text-overline text-text-muted">STEP 2 OF 5</span>
          <button
            aria-label="Close onboarding"
            className="text-text-muted hover:text-on-background transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2 rounded p-space-1"
            onClick={onClose}
            type="button"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="w-full h-1 bg-surface-variant rounded-full overflow-hidden">
          <div className="h-full bg-primary-container w-2/5 rounded-full transition-all duration-300"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-space-6 md:py-space-16 px-space-4 sm:px-space-6 lg:px-space-8">
        <div className="w-full max-w-lg md:max-w-2xl bg-bg-card rounded-xl shadow-sm md:shadow-elevated overflow-hidden border border-border-default/50">
          {/* Desktop: Header Section */}
          <div className="hidden md:block px-space-6 md:px-space-8 py-space-6 border-b border-border-default/30 bg-surface-container-lowest">
            <div className="flex items-center justify-between mb-space-4">
              <span className="text-primary font-bold text-xl tracking-tight">HostelPak</span>
              <div className="text-text-muted font-label text-label">Step 2 of 5</div>
            </div>
            <div className="w-full bg-surface-container-highest rounded-full h-2 mb-space-6">
              <div className="bg-primary-container h-2 rounded-full transition-all duration-500" style={{ width: '40%' }}></div>
            </div>
            <h1 className="font-h2 text-h2 text-text-heading mb-space-2">Basic Information</h1>
            <p className="font-body-default text-body-default text-text-muted">Let's start with the essential details about your property.</p>
          </div>

          {/* Mobile: Content Header */}
          <div className="md:hidden px-space-4 py-space-6">
            <h1 className="font-h2 text-h2 text-text-heading mb-space-2">Basic Information</h1>
            <p className="font-body-default text-body-default text-text-body">Let's start with the essential details about your property.</p>
          </div>

          {/* Form Content */}
          <div className="px-space-4 md:px-space-8 py-space-6 md:py-space-8 bg-bg-card">
            <form className="space-y-space-6" onSubmit={handleSubmit}>
              {/* Hostel Name */}
              <div>
                <label className="block font-label text-label text-text-heading mb-space-1" htmlFor="hostel-name">
                  Hostel Name
                </label>
                <input
                  className={`w-full h-[42px] px-space-3 bg-surface-container-lowest border rounded text-on-background font-body-default text-body-default placeholder:text-text-placeholder focus:outline-none transition-all shadow-sm ${
                    errors.hostelName ? 'border-error focus:ring-1 focus:ring-error' : 'border-border-default focus:ring-1 focus:ring-primary-container focus:border-primary-container'
                  }`}
                  id="hostel-name"
                  name="hostel-name"
                  placeholder="e.g., Sunrise Backpackers"
                  type="text"
                  value={formData.hostelName}
                  onChange={(e) => {
                    setFormData({ ...formData, hostelName: e.target.value });
                    if (errors.hostelName) setErrors({ ...errors, hostelName: '' });
                  }}
                />
                {errors.hostelName && <p className="mt-1 font-label text-[11px] text-error">{errors.hostelName}</p>}
              </div>

              {/* City Select */}
              <div>
                <label className="block font-label text-label text-text-heading mb-space-1" htmlFor="city">
                  City
                </label>
                <div className="relative">
                  <select
                    className={`w-full h-[42px] pl-space-3 pr-space-10 bg-surface-container-lowest border rounded text-on-background font-body-default text-body-default focus:outline-none transition-all shadow-sm appearance-none cursor-pointer ${
                      errors.city ? 'border-error focus:ring-1 focus:ring-error' : 'border-border-default focus:ring-1 focus:ring-primary-container focus:border-primary-container'
                    }`}
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={(e) => {
                      setFormData({ ...formData, city: e.target.value });
                      if (errors.city) setErrors({ ...errors, city: '' });
                    }}
                  >
                    <option value="">Select a city</option>
                    {CITIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-space-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" strokeWidth={1.5} />
                </div>
                {errors.city && <p className="mt-1 font-label text-[11px] text-error">{errors.city}</p>}
              </div>

              {/* Street Address */}
              <div>
                <label className="block font-label text-label text-text-heading mb-space-1" htmlFor="address">
                  Street Address
                </label>
                <input
                  className={`w-full h-[42px] px-space-3 bg-surface-container-lowest border rounded text-on-background font-body-default text-body-default placeholder:text-text-placeholder focus:outline-none transition-all shadow-sm ${
                    errors.address ? 'border-error focus:ring-1 focus:ring-error' : 'border-border-default focus:ring-1 focus:ring-primary-container focus:border-primary-container'
                  }`}
                  id="address"
                  name="address"
                  placeholder="123 Main Street"
                  type="text"
                  value={formData.address}
                  onChange={(e) => {
                    setFormData({ ...formData, address: e.target.value });
                    if (errors.address) setErrors({ ...errors, address: '' });
                  }}
                />
                {errors.address && <p className="mt-1 font-label text-[11px] text-error">{errors.address}</p>}
              </div>

              {/* Property Audience Radio Group */}
              <div>
                <label className="block font-label text-label text-text-heading mb-space-3">Property Audience</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-3">
                  {[
                    { value: 'mixed', label: 'Mixed / All' },
                    { value: 'female', label: 'Female Only' },
                    { value: 'male', label: 'Male Only' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-space-3 p-space-3 rounded border border-border-default bg-surface-container-lowest cursor-pointer hover:bg-surface-bright transition-colors has-[:checked]:border-primary-container has-[:checked]:bg-bg-raised"
                    >
                      <input
                        checked={formData.audience === option.value}
                        className="w-5 h-5 text-primary-container bg-surface-container-lowest border-border-strong focus:ring-primary-container focus:ring-offset-1"
                        name="audience"
                        type="radio"
                        value={option.value}
                        onChange={(e) => setFormData({ ...formData, audience: e.target.value as 'mixed' | 'female' | 'male' })}
                      />
                      <div className="flex flex-col">
                        <span className="font-body-default text-body-default text-on-background font-medium">{option.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </form>
          </div>

          {/* Footer Actions */}
          <div className="px-space-4 md:px-space-8 py-space-4 md:py-space-5 border-t border-border-default/30 bg-surface-container-lowest md:flex md:items-center md:justify-between md:gap-space-4 grid grid-cols-3 gap-space-3">
            <button
              className="md:flex-initial px-space-4 py-space-2 rounded font-label text-label text-text-heading border border-border-default hover:bg-surface-bright transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary-container outline-none h-[48px] md:h-[42px] flex items-center justify-center col-span-1"
              onClick={onBack}
              type="button"
            >
              Back
            </button>
            <button
              className="md:flex-initial col-span-2 px-space-6 md:px-space-8 py-space-2 rounded font-label text-label text-on-primary bg-action hover:bg-action-dark active:scale-95 transition-all focus:ring-2 focus:ring-offset-2 focus:ring-action outline-none shadow-sm h-[48px] md:h-[42px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
              type="submit"
            >
              {loading ? 'Processing...' : 'Next Step'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
