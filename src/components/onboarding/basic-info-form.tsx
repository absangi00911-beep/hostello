'use client';

import { FormEvent, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface BasicInfoFormProps {
  onSubmit?: (data: BasicInfoData) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export interface BasicInfoData {
  hostelName: string;
  city: string;
  address: string;
  genderType: 'all' | 'female' | 'male';
}

const CITIES = [
  { value: 'lahore', label: 'Lahore' },
  { value: 'karachi', label: 'Karachi' },
  { value: 'islamabad', label: 'Islamabad' },
  { value: 'rawalpindi', label: 'Rawalpindi' },
  { value: 'peshawar', label: 'Peshawar' },
  { value: 'multan', label: 'Multan' },
  { value: 'faisalabad', label: 'Faisalabad' },
];

export function BasicInfoForm({ onSubmit, isLoading, error }: BasicInfoFormProps) {
  const [formData, setFormData] = useState<BasicInfoData>({
    hostelName: '',
    city: '',
    address: '',
    genderType: 'all',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleRadioChange = (value: 'all' | 'female' | 'male') => {
    setFormData((prev) => ({ ...prev, genderType: value }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.hostelName.trim()) {
      errors.hostelName = 'Hostel name is required';
    }

    if (!formData.city) {
      errors.city = 'Please select a city';
    }

    if (!formData.address.trim()) {
      errors.address = 'Street address is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await onSubmit?.(formData);
    } catch (err) {
      setFieldErrors((prev) => ({
        ...prev,
        submit: err instanceof Error ? err.message : 'Failed to save information',
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-space-6">
      {/* General Error */}
      {error && (
        <div className="p-space-3 bg-error-container border border-error rounded text-error font-label text-label">
          {error}
        </div>
      )}

      {/* Hostel Name */}
      <div>
        <label className="block font-label text-label text-text-heading mb-space-2" htmlFor="hostelName">
          Hostel Name
        </label>
        <input
          id="hostelName"
          name="hostelName"
          type="text"
          value={formData.hostelName}
          onChange={handleChange}
          required
          className={`w-full h-[42px] px-space-4 py-space-2 bg-surface-container-lowest border rounded-DEFAULT text-text-body focus:ring-1 outline-none transition-all placeholder:text-text-placeholder ${
            fieldErrors.hostelName
              ? 'border-error focus:ring-error'
              : 'border-border-strong focus:ring-primary-container focus:border-primary-container'
          }`}
          placeholder="e.g., The Sunshine Student Lodge"
        />
        {fieldErrors.hostelName && (
          <p className="font-label text-[11px] text-error mt-space-1">{fieldErrors.hostelName}</p>
        )}
      </div>

      {/* City Selector */}
      <div>
        <label className="block font-label text-label text-text-heading mb-space-2" htmlFor="city">
          City
        </label>
        <div className="relative">
          <select
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            className={`w-full h-[42px] px-space-4 py-space-2 bg-surface-container-lowest border rounded-DEFAULT text-text-body appearance-none focus:ring-1 outline-none transition-all ${
              fieldErrors.city
                ? 'border-error focus:ring-error'
                : 'border-border-strong focus:ring-primary-container focus:border-primary-container'
            }`}
          >
            <option value="" disabled>
              Select a city...
            </option>
            {CITIES.map((city) => (
              <option key={city.value} value={city.value}>
                {city.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-space-3 text-text-muted">
            <ChevronDown className="w-5 h-5" strokeWidth={1.5} />
          </div>
        </div>
        {fieldErrors.city && (
          <p className="font-label text-[11px] text-error mt-space-1">{fieldErrors.city}</p>
        )}
      </div>

      {/* Address */}
      <div>
        <label className="block font-label text-label text-text-heading mb-space-2" htmlFor="address">
          Street Address
        </label>
        <input
          id="address"
          name="address"
          type="text"
          value={formData.address}
          onChange={handleChange}
          required
          className={`w-full h-[42px] px-space-4 py-space-2 bg-surface-container-lowest border rounded-DEFAULT text-text-body focus:ring-1 outline-none transition-all placeholder:text-text-placeholder ${
            fieldErrors.address
              ? 'border-error focus:ring-error'
              : 'border-border-strong focus:ring-primary-container focus:border-primary-container'
          }`}
          placeholder="123 University Avenue"
        />
        {fieldErrors.address && (
          <p className="font-label text-[11px] text-error mt-space-1">{fieldErrors.address}</p>
        )}
      </div>

      {/* Gender Type (Radio Buttons) */}
      <div>
        <label className="block font-label text-label text-text-heading mb-space-3">
          Property Audience (Gender)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-3">
          {[
            { value: 'all' as const, label: 'Mixed / All' },
            { value: 'female' as const, label: 'Female Only' },
            { value: 'male' as const, label: 'Male Only' },
          ].map((option) => (
            <label
              key={option.value}
              className="relative flex items-center p-space-4 border border-border-strong rounded-lg cursor-pointer hover:bg-bg-raised transition-colors has-[:checked]:border-primary-container has-[:checked]:bg-bg-overlay"
            >
              <input
                type="radio"
                name="genderType"
                value={option.value}
                checked={formData.genderType === option.value}
                onChange={() => handleRadioChange(option.value)}
                className="sr-only peer"
              />
              <div
                className={`w-4 h-4 rounded-full border-2 mr-space-3 flex items-center justify-center transition-all ${
                  formData.genderType === option.value
                    ? 'border-primary-container'
                    : 'border-border-strong'
                }`}
              >
                {formData.genderType === option.value && (
                  <div className="w-2 h-2 rounded-full bg-primary-container" />
                )}
              </div>
              <span className="font-label text-label text-text-heading">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </form>
  );
}
