'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoginForm } from './login-form';

export function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    setError('');

    try {
      // Replace with actual API call
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Sign in failed');
      }

      // Redirect to dashboard or home
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-bg-page min-h-screen flex items-center justify-center p-space-4 font-body-default text-body-default text-text-body antialiased">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-space-8">
          <Link
            href="/"
            className="inline-block font-h2 text-h3 text-primary-container tracking-tight hover:text-primary-deep transition-colors"
          >
            HostelPak
          </Link>
        </div>

        {/* Card */}
        <div className="bg-bg-card rounded-xl p-space-6 sm:p-space-8 shadow-[0_8px_32px_-4px_rgba(194,139,26,0.12)] border border-border-default/50">
          {/* Header */}
          <h1 className="font-h2 text-h2 text-text-heading text-center mb-space-2">
            Welcome back
          </h1>
          <p className="text-center text-text-muted mb-space-8">
            Enter your details to access your account.
          </p>

          {/* Form */}
          <LoginForm onSubmit={handleLogin} isLoading={isLoading} error={error} />

          {/* Divider & Sign Up Link */}
          <div className="mt-space-8 pt-space-6 border-t border-border-default text-center">
            <p className="font-body-default text-body-default text-text-muted">
              Don't have an account?{' '}
              <Link
                href="/auth/signup"
                className="font-label text-label text-action hover:text-action-pressed hover:underline transition-all"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
