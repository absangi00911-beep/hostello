'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

interface LoginFormProps {
  onSubmit?: (data: { email: string; password: string }) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export function LoginForm({ onSubmit, isLoading, error }: LoginFormProps) {
  const [formData, setFormData] = useState({
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
      {/* Email */}
      <div className="flex flex-col gap-space-2">
        <label className="font-label text-label text-text-heading" htmlFor="email">
          Email Address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          className={`h-[42px] px-space-3 rounded bg-surface-container-lowest border text-text-body placeholder:text-text-placeholder focus:outline-none focus:ring-[1.5px] transition-shadow ${
            fieldErrors.email
              ? 'border-error focus:ring-error/30'
              : 'border-border-default focus:border-primary-container focus:ring-primary-container/30'
          }`}
          placeholder="you@example.com"
        />
        {fieldErrors.email && (
          <p className="font-label text-[11px] text-error">{fieldErrors.email}</p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-space-2">
        <div className="flex justify-between items-baseline">
          <label className="font-label text-label text-text-heading" htmlFor="password">
            Password
          </label>
          <Link
            href="/auth/forgot-password"
            className="font-label text-label text-action hover:text-action-pressed transition-colors"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          className={`h-[42px] px-space-3 rounded bg-surface-container-lowest border text-text-body placeholder:text-text-placeholder focus:outline-none focus:ring-[1.5px] transition-shadow ${
            fieldErrors.password
              ? 'border-error focus:ring-error/30'
              : 'border-border-default focus:border-primary-container focus:ring-primary-container/30'
          }`}
          placeholder="••••••••"
        />
        {fieldErrors.password && (
          <p className="font-label text-[11px] text-error">{fieldErrors.password}</p>
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
        className="mt-space-2 w-full h-[42px] bg-action disabled:bg-text-muted text-on-primary font-label text-label rounded flex items-center justify-center gap-space-2 hover:bg-action-pressed hover:-translate-y-[1px] hover:shadow-sm active:scale-[0.97] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-action focus:ring-offset-bg-card"
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
