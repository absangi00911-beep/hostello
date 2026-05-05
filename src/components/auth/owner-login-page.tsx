'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OwnerLoginForm } from './owner-login-form';

export function OwnerLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    setError('');

    try {
      // Replace with actual API call
      const response = await fetch('/api/auth/owner/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Sign in failed');
      }

      // Redirect to owner dashboard
      router.push('/owner/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-bg-page min-h-screen flex items-center justify-center p-space-4">
      <div className="w-full max-w-md bg-bg-card rounded-lg shadow-sm border border-border-default p-space-6 sm:p-space-8 flex flex-col gap-space-8">
        {/* Header Section */}
        <header className="flex flex-col items-center text-center gap-space-2">
          <Link href="/" className="font-display text-h2 text-primary-container tracking-tight hover:text-primary-deep transition-colors">
            HostelPak
          </Link>
          <p className="font-body-default text-body-default text-text-muted">Securely access your account</p>
        </header>

        {/* Form Section */}
        <OwnerLoginForm onSubmit={handleLogin} isLoading={isLoading} error={error} />

        {/* Footer Section */}
        <footer className="text-center pt-space-2 border-t border-border-default/50">
          <p className="font-body-default text-body-default text-text-muted">
            Don't have an account?{' '}
            <Link
              href="/onboarding/step-1"
              className="font-label text-label text-primary-container hover:text-primary-deep hover:underline transition-colors ml-space-1"
            >
              Sign up
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
