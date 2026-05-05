'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';

interface SignUpFormResponsiveProps {
  onSubmit?: (data: { fullName: string; email: string; password: string }) => void;
}

export function SignUpFormResponsive({ onSubmit }: SignUpFormResponsiveProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
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
    <main className="w-full max-w-[400px] mx-auto">
      {/* Card Container */}
      <div className="bg-bg-card shadow-md shadow-surface-tint/5 rounded-xl md:rounded-lg p-space-6 sm:p-space-8 border border-border-default">
        {/* Header */}
        <div className="text-center mb-space-8">
          <a
            aria-label="HostelPak Home"
            className="inline-block text-xl font-black tracking-tight text-primary-container mb-space-6"
            href="/"
          >
            HostelPak
          </a>
          <h1 className="font-h3 text-h3 text-text-heading mb-space-2">Create your account</h1>
          <p className="font-body-default text-body-default text-text-muted">
            Start booking secure student housing today.
          </p>
        </div>

        {/* Form */}
        <form className="space-y-space-5" onSubmit={handleSubmit}>
          {/* Full Name Field */}
          <div>
            <label className="block font-label text-label text-on-surface mb-space-1" htmlFor="fullName">
              Full Name
            </label>
            <input
              className={`w-full h-[42px] px-3 py-2 bg-surface-container-lowest border rounded-DEFAULT font-body-default text-body-default text-on-surface placeholder:text-text-placeholder transition-colors focus:outline-none focus:ring-1 ${
                errors.fullName ? 'border-error focus:ring-error' : 'border-border-strong focus:ring-primary-container focus:border-primary-container'
              }`}
              id="fullName"
              name="fullName"
              placeholder="Jane Doe"
              type="text"
              value={formData.fullName}
              onChange={(e) => {
                setFormData({ ...formData, fullName: e.target.value });
                if (errors.fullName) setErrors({ ...errors, fullName: '' });
              }}
            />
            {errors.fullName && <p className="mt-1 font-label text-[11px] text-error">{errors.fullName}</p>}
          </div>

          {/* Email Field */}
          <div>
            <label className="block font-label text-label text-on-surface mb-space-1" htmlFor="email">
              Email Address
            </label>
            <input
              className={`w-full h-[42px] px-3 py-2 bg-surface-container-lowest border rounded-DEFAULT font-body-default text-body-default text-on-surface placeholder:text-text-placeholder transition-colors focus:outline-none focus:ring-1 ${
                errors.email ? 'border-error focus:ring-error' : 'border-border-strong focus:ring-primary-container focus:border-primary-container'
              }`}
              id="email"
              name="email"
              placeholder="jane@example.com"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
            />
            {errors.email && <p className="mt-1 font-label text-[11px] text-error">{errors.email}</p>}
          </div>

          {/* Password Field */}
          <div>
            <label className="block font-label text-label text-on-surface mb-space-1" htmlFor="password">
              Password
            </label>
            <input
              className={`w-full h-[42px] px-3 py-2 bg-surface-container-lowest border rounded-DEFAULT font-body-default text-body-default text-on-surface placeholder:text-text-placeholder transition-colors focus:outline-none focus:ring-1 ${
                errors.password ? 'border-error focus:ring-error' : 'border-border-strong focus:ring-primary-container focus:border-primary-container'
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
            <p className="mt-1 font-label text-[11px] text-text-muted">Must be at least 8 characters.</p>
            {errors.password && <p className="font-label text-[11px] text-error">{errors.password}</p>}
          </div>

          {/* Submit Button */}
          <button
            className="w-full h-[42px] mt-space-2 bg-action hover:bg-action-dark text-on-primary font-label text-label rounded-DEFAULT transition-all duration-150 active:scale-97 shadow-sm focus:outline-none focus:ring-2 focus:ring-action focus:ring-offset-2 focus:ring-offset-bg-card disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-space-6 mb-space-6 flex items-center justify-center">
          <div className="w-full h-px bg-border-default"></div>
          <span className="px-3 font-label text-label text-text-muted bg-bg-card">or</span>
          <div className="w-full h-px bg-border-default"></div>
        </div>

        {/* Google Sign In Button */}
        <button
          className="w-full h-[42px] flex items-center justify-center gap-space-2 bg-surface-container-lowest border border-border-strong hover:bg-surface-container-low text-on-surface font-label text-label rounded-DEFAULT transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-outline focus:ring-offset-2 focus:ring-offset-bg-card"
          type="button"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            ></path>
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            ></path>
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            ></path>
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            ></path>
          </svg>
          Sign up with Google
        </button>

        {/* Sign In Link */}
        <div className="mt-space-8 text-center">
          <p className="font-body-default text-[13px] text-text-muted">
            Already have an account?{' '}
            <Link className="font-label text-action hover:text-action-dark underline transition-colors" href="/auth/signin">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
