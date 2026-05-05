'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { EmailVerificationResponsive } from '@/components/auth/email-verification-responsive';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // Get email from URL params or session
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    } else {
      // Try to get from session storage
      const storedEmail = sessionStorage.getItem('pendingVerificationEmail');
      if (storedEmail) {
        setEmail(storedEmail);
      }
    }
  }, [searchParams]);

  const handleResend = async () => {
    if (!email) {
      return;
    }

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
    } catch (err) {
      console.error('Resend error:', err);
      throw err;
    }
  };

  const handleChangeEmail = () => {
    sessionStorage.removeItem('pendingVerificationEmail');
    router.push('/auth/signup');
  };

  return <EmailVerificationResponsive email={email || undefined} onResend={handleResend} onChangeEmail={handleChangeEmail} />;
}
