'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { VerifyEmailForm } from '@/components/auth/verify-email-form';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Get email from URL params or session
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    } else {
      // Try to get from session storage or fetch from API
      const storedEmail = sessionStorage.getItem('pendingVerificationEmail');
      if (storedEmail) {
        setEmail(storedEmail);
      }
    }
  }, [searchParams]);

  const handleResend = async () => {
    if (!email) {
      setError('Email address not found. Please try signing up again.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resend verification email');
      }

      setMessage('Verification email sent! Check your inbox.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="bg-bg-page min-h-screen flex items-center justify-center p-space-4">
      <div className="w-full max-w-[480px]">
        <VerifyEmailForm
          email={email || undefined}
          onResend={handleResend}
          isLoading={isLoading}
          message={message}
          error={error}
        />
      </div>
    </main>
  );
}
