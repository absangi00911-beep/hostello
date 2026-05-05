'use client';

import { FormEvent, useState } from 'react';

interface SignupFormProps {
  onSubmit?: (data: { name: string; email: string; password: string }) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export function SignupForm({ onSubmit, isLoading, error }: SignupFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
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
        submit: err instanceof Error ? err.message : 'Sign up failed. Please try again.',
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-space-5">
      {/* Full Name */}
      <div>
        <label className="block font-label text-label text-on-surface mb-space-1" htmlFor="name">
          Full Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          required
          className={`w-full h-[42px] px-3 py-2 bg-surface-container-lowest border rounded-DEFAULT text-on-surface placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-primary-container font-body-default text-body-default transition-colors ${
            fieldErrors.name ? 'border-error focus:ring-error' : 'border-border-strong focus:border-primary-container'
          }`}
          placeholder="John Doe"
        />
        {fieldErrors.name && (
          <p className="mt-1 font-label text-[11px] text-error">{fieldErrors.name}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block font-label text-label text-on-surface mb-space-1" htmlFor="email">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          className={`w-full h-[42px] px-3 py-2 bg-surface-container-lowest border rounded-DEFAULT text-on-surface placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-primary-container font-body-default text-body-default transition-colors ${
            fieldErrors.email ? 'border-error focus:ring-error' : 'border-border-strong focus:border-primary-container'
          }`}
          placeholder="you@example.com"
        />
        {fieldErrors.email && (
          <p className="mt-1 font-label text-[11px] text-error">{fieldErrors.email}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block font-label text-label text-on-surface mb-space-1" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          className={`w-full h-[42px] px-3 py-2 bg-surface-container-lowest border rounded-DEFAULT text-on-surface placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-primary-container font-body-default text-body-default transition-colors ${
            fieldErrors.password ? 'border-error focus:ring-error' : 'border-border-strong focus:border-primary-container'
          }`}
          placeholder="••••••••"
        />
        <p className="mt-1 font-label text-[11px] text-text-muted">Must be at least 8 characters.</p>
        {fieldErrors.password && (
          <p className="mt-1 font-label text-[11px] text-error">{fieldErrors.password}</p>
        )}
      </div>

      {/* General Error */}
      {error && (
        <div className="p-3 bg-error-container border border-error rounded text-error font-label text-label">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-[42px] mt-space-2 bg-action hover:bg-action-dark disabled:bg-text-muted text-on-primary font-label text-label rounded-DEFAULT transition-all duration-150 active:scale-97 shadow-sm focus:outline-none focus:ring-2 focus:ring-action focus:ring-offset-2 focus:ring-offset-bg-card"
      >
        {isLoading ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  );
}
