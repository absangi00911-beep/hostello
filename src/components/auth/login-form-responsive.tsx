'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

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
          <div className="flex flex-col gap-space-2">
            <label className="font-label text-label text-text-heading" htmlFor="email">
              Email Address
            </label>
            <input
              className={`h-[42px] px-space-3 rounded bg-surface-container-lowest border transition-shadow focus:outline-none ${
                errors.email
                  ? 'border-error focus:ring-[1.5px] focus:ring-error/30'
                  : 'border-border-default focus:border-primary-container focus:ring-[1.5px] focus:ring-primary-container/30'
              }`}
              id="email"
              name="email"
              placeholder="you@example.com"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
            />
            {errors.email && <p className="font-label text-[11px] text-error">{errors.email}</p>}
          </div>

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
            <input
              className={`h-[42px] px-space-3 rounded bg-surface-container-lowest border transition-shadow focus:outline-none ${
                errors.password
                  ? 'border-error focus:ring-[1.5px] focus:ring-error/30'
                  : 'border-border-default focus:border-primary-container focus:ring-[1.5px] focus:ring-primary-container/30'
              }`}
              id="password"
              name="password"
              placeholder="••••••••"
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
            />
            {errors.password && <p className="font-label text-[11px] text-error">{errors.password}</p>}
          </div>

          {/* Sign In Button */}
          <button
            className="mt-space-2 w-full h-[42px] bg-action text-on-primary font-label text-label rounded flex items-center justify-center gap-space-2 hover:bg-action-pressed md:hover:-translate-y-[1px] md:hover:shadow-sm active:scale-[0.97] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-action focus:ring-offset-card disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
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
