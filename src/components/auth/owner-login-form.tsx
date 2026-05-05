'use client';

import { FormEvent, useState } from 'react';
import { LogIn } from 'lucide-react';

interface OwnerLoginFormProps {
  onSubmit?: (data: { email: string; password: string }) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export function OwnerLoginForm({ onSubmit, isLoading, error }: OwnerLoginFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
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
        submit: err instanceof Error ? err.message : 'Sign in failed. Please try again.',
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-space-5">
      {/* General Error */}
      {error && (
        <div className="p-space-3 bg-error-container border border-error rounded text-error font-label text-label">
          {error}
        </div>
      )}

      {/* Email */}
      <div className="flex flex-col gap-space-1">
        <label className="font-label text-label text-text-heading" htmlFor="ownerEmail">
          Email Address
        </label>
        <input
          id="ownerEmail"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          className={`h-[42px] px-space-3 w-full bg-surface-container-lowest border rounded-DEFAULT font-body-default text-body-default text-text-heading placeholder:text-text-placeholder focus:outline-none focus:ring-1 transition-all ${
            fieldErrors.email
              ? 'border-error focus:border-error focus:ring-error'
              : 'border-border-default focus:border-primary-container focus:ring-primary-container'
          }`}
          placeholder="Enter your email"
        />
        {fieldErrors.email && (
          <p className="font-label text-[11px] text-error">{fieldErrors.email}</p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-space-1">
        <div className="flex justify-between items-center w-full">
          <label className="font-label text-label text-text-heading" htmlFor="ownerPassword">
            Password
          </label>
          <a
            href="/auth/forgot-password"
            className="font-label text-label text-primary-container hover:text-primary-deep transition-colors"
          >
            Forgot password?
          </a>
        </div>
        <input
          id="ownerPassword"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          className={`h-[42px] px-space-3 w-full bg-surface-container-lowest border rounded-DEFAULT font-body-default text-body-default text-text-heading placeholder:text-text-placeholder focus:outline-none focus:ring-1 transition-all ${
            fieldErrors.password
              ? 'border-error focus:border-error focus:ring-error'
              : 'border-border-default focus:border-primary-container focus:ring-primary-container'
          }`}
          placeholder="••••••••"
        />
        {fieldErrors.password && (
          <p className="font-label text-[11px] text-error">{fieldErrors.password}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="mt-space-2 h-[42px] w-full bg-secondary disabled:bg-text-muted text-on-secondary font-label text-label rounded-DEFAULT flex items-center justify-center gap-space-2 hover:bg-secondary/90 active:scale-97 transition-all focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-bg-card"
      >
        <LogIn className="w-5 h-5" strokeWidth={1.5} />
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
