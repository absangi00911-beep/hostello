'use client';

import { useRouter } from 'next/navigation';
import { LoginFormResponsive } from '@/components/auth/login-form-responsive';

export default function SignInPage() {
  const router = useRouter();

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      // Make API call to sign in
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Sign in failed');
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Sign in error:', err);
      throw err;
    }
  };

  return (
    <main className="bg-bg-page min-h-screen flex items-center justify-center p-space-4 font-body-default text-body-default text-text-body antialiased">
      <LoginFormResponsive onSubmit={handleLogin} />
    </main>
  );
}
