'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { TextInput, PrimaryButton } from '@/components/ui';

interface LoginFormResponsiveProps {
  onSubmit?: (data: { email: string; password: string }) => void;
}

export function LoginFormResponsive({ onSubmit }: LoginFormResponsiveProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full max-w-md mx-auto">
      {/* Logo - Mobile visible, desktop moved up */}
      <div className="text-center mb-space-8 md:mb-space-6">
        <span className="font-h2 text-h3 md:text-h2 text-primary-container tracking-tight">HostelPak</span>
      </div>

      {/* Card Container */}
      <div className="bg-card rounded-lg md:rounded-xl p-space-6 sm:p-space-8 shadow-sm md:shadow-[0_8px_32px_-4px_rgba(194,139,26,0.12)] border border-border-default md:border-border-default/50">
        {/* Header */}
        <h1 className="font-h2 text-h2 text-text-heading text-center mb-space-2">Welcome back</h1>
        <p className="text-center text-text-muted mb-space-8">Enter your details to access your account.</p>

        {/* Form */}
        <form className="flex flex-col gap-space-5" onSubmit={handleSubmit}>
          {/* Email Field */}
          <TextInput
            id="email"
            name="email"
            label="Email Address"
            placeholder="you@example.com"
            type="email"
            value={formData.email}
            error={errors.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
          />

          {/* Password Field */}
          <div className="flex flex-col gap-space-2">
            <div className="flex justify-between items-baseline">
              <label className="font-label text-label text-text-heading" htmlFor="password">
                Password
              </label>
              <Link
                className="font-label text-label text-action hover:text-action-pressed transition-colors"
                href="/auth/forgot-password"
              >
                Forgot password?
              </Link>
            </div>
            <TextInput
              id="password"
              name="password"
              placeholder="••••••••"
              type="password"
              value={formData.password}
              error={errors.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
            />
          </div>

          {/* Sign In Button */}
          <PrimaryButton
            className="mt-space-2 w-full"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </PrimaryButton>
        </form>

        {/* Footer */}
        <div className="mt-space-8 pt-space-6 border-t border-border-default text-center">
          <p className="font-body-default text-body-default text-text-muted">
            Don't have an account?{' '}
            <Link className="font-label text-label text-action hover:text-action-pressed hover:underline transition-all" href="/auth/signup">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
