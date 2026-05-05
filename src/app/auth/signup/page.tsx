'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SignupForm } from './signup-form';
import { GoogleSigninButton } from './google-signin-button';
import { AuthDivider } from './auth-divider';

export function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (data: { name: string; email: string; password: string }) => {
    setIsLoading(true);
    setError('');

    try {
      // Replace with actual API call
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Sign up failed');
      }

      // Redirect to verification page or home
      router.push('/auth/verify-email');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignin = async () => {
    setIsLoading(true);
    try {
      // Replace with actual OAuth flow
      window.location.href = '/api/auth/google';
    } catch (err) {
      setError('Google sign in failed');
      setIsLoading(false);
    }
  };

  return (
    <main className="w-full min-h-screen bg-bg-page flex items-center justify-center p-space-4 font-body-default text-text-body">
      <div className="w-full max-w-md">
        <div className="bg-bg-card shadow-md shadow-surface-tint/5 rounded-lg p-space-8 border border-border-default">
          {/* Header */}
          <div className="text-center mb-space-8">
            <Link
              href="/"
              className="inline-block text-xl font-black tracking-tight text-primary-container mb-space-6 hover:text-primary-deep transition-colors"
            >
              HostelPak
            </Link>

            <h1 className="font-h3 text-h3 text-text-heading mb-space-2">Create your account</h1>
            <p className="font-body-default text-body-default text-text-muted">
              Start booking secure student housing today.
            </p>
          </div>

          {/* Form */}
          <SignupForm onSubmit={handleSignup} isLoading={isLoading} error={error} />

          {/* Divider */}
          <AuthDivider />

          {/* Google Sign In */}
          <GoogleSigninButton onClick={handleGoogleSignin} isLoading={isLoading} />

          {/* Sign In Link */}
          <div className="mt-space-8 text-center">
            <p className="font-body-default text-[13px] text-text-muted">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-label text-action hover:text-action-dark underline transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
