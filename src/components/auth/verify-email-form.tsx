'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

interface VerifyEmailFormProps {
  email?: string;
  onResend?: () => Promise<void>;
  isLoading?: boolean;
  message?: string;
  error?: string;
}

export function VerifyEmailForm({
  email,
  onResend,
  isLoading,
  message,
  error,
}: VerifyEmailFormProps) {
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage('');

    try {
      await onResend?.();
      setResendMessage('Verification email sent! Check your inbox.');
    } catch (err) {
      setResendMessage(
        err instanceof Error ? err.message : 'Failed to resend email'
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="bg-bg-card rounded-xl shadow-sm border border-border-default p-space-8 md:p-space-12 flex flex-col items-center text-center">
      {/* Icon */}
      <div className="w-20 h-20 bg-primary-faint rounded-full flex items-center justify-center mb-space-6 shadow-sm shadow-primary-container/20">
        <ShieldCheck className="w-10 h-10 text-primary-container" strokeWidth={1.5} />
      </div>

      {/* Heading */}
      <h1 className="font-h2 text-h2 text-text-heading mb-space-3">
        Check your email
      </h1>

      {/* Description */}
      <p className="font-body-default text-body-default text-text-body mb-space-8 max-w-[320px]">
        We sent a verification link to{' '}
        {email ? <span className="font-label font-600">{email}</span> : 'your email address'}.
        Please click it to continue.
      </p>

      {/* Messages */}
      {message && (
        <div className="mb-space-6 p-space-3 bg-success-container/20 border border-success rounded text-success font-label text-label w-full">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-space-6 p-space-3 bg-error-container border border-error rounded text-error font-label text-label w-full">
          {error}
        </div>
      )}

      {resendMessage && (
        <div className={`mb-space-6 p-space-3 rounded font-label text-label w-full ${
          resendMessage.includes('Failed')
            ? 'bg-error-container/20 border border-error text-error'
            : 'bg-success-container/20 border border-success text-success'
        }`}>
          {resendMessage}
        </div>
      )}

      {/* Buttons */}
      <div className="w-full space-y-space-4">
        <button
          onClick={handleResend}
          disabled={resendLoading || isLoading}
          className="w-full bg-action hover:bg-action-pressed disabled:bg-text-muted text-on-primary font-label text-label py-3 px-6 rounded-DEFAULT transition-all duration-200 transform hover:scale-[0.98] active:scale-[0.95] focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2 flex justify-center items-center"
        >
          {resendLoading ? 'Sending...' : 'Resend email'}
        </button>

        <Link
          href="/auth/change-email"
          className="w-full bg-transparent border border-border-strong text-text-heading font-label text-label py-3 px-6 rounded-DEFAULT hover:bg-bg-raised transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2 block"
        >
          Change email address
        </Link>
      </div>

      {/* Footer */}
      <div className="mt-space-8 pt-space-6 border-t border-border-default w-full">
        <p className="font-label text-label text-text-muted">
          Didn't receive the email? Check your spam folder or contact{' '}
          <Link href="/support" className="text-action hover:text-action-pressed underline">
            support
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
