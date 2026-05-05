'use client';

import { useRouter } from 'next/navigation';
import { SignUpFormResponsive } from '@/components/auth/signup-form-responsive';

export default function SignUpPage() {
  const router = useRouter();

  const handleSignup = async (data: { fullName: string; email: string; password: string }) => {
    try {
      // Make API call to sign up
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.fullName,
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Sign up failed');
      }

      // Redirect to email verification
      router.push('/auth/verify-email');
    } catch (err) {
      console.error('Sign up error:', err);
      throw err;
    }
  };

  return (
    <main className="w-full min-h-screen bg-bg-page flex items-center justify-center p-space-4 font-body-default text-text-body">
      <SignUpFormResponsive onSubmit={handleSignup} />
    </main>
  );
}
