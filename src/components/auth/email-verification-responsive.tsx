'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';

interface EmailVerificationResponsiveProps {
  email?: string;
  onResend?: () => void;
  onChangeEmail?: () => void;
}

export function EmailVerificationResponsive({
  email,
  onResend,
  onChangeEmail,
}: EmailVerificationResponsiveProps) {
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleResend = async () => {
    setResendLoading(true);
    try {
      if (onResend) {
        await onResend();
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 3000);
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="bg-bg-page min-h-screen flex items-center justify-center p-4">
      {/* Transactional screen - Navigation suppressed */}
      <main className="w-full max-w-[400px] md:max-w-[480px]">
        <div className="bg-bg-card rounded-xl shadow-sm border border-border-default p-space-6 sm:p-space-8 md:p-space-12 flex flex-col items-center text-center">
          {/* Icon Container */}
          <div className="w-20 h-20 bg-primary-faint rounded-full flex items-center justify-center mb-space-6 shadow-sm shadow-primary-container/20">
            <Shield className="w-10 h-10 md:w-12 md:h-12 text-primary-container" strokeWidth={1.5} fill="currentColor" />
          </div>

          {/* Heading */}
          <h1 className="font-h2 text-h2 text-text-heading mb-space-3">Check your email</h1>

          {/* Body Text */}
          <p className="font-body-default md:font-body-lg text-body-default md:text-body-lg text-text-muted mb-space-8 max-w-[320px]">
            We sent a verification link to {email ? <span className="font-semibold text-text-heading">{email}</span> : 'your email address'}. Please click
            it to continue.
          </p>

          {/* Success Message */}
          {resendSuccess && (
            <div className="w-full mb-space-6 p-space-4 bg-success/10 border border-success rounded-lg">
              <p className="font-label text-label text-success">Verification email sent successfully!</p>
            </div>
          )}

          {/* Buttons */}
          <div className="w-full space-y-space-4">
            <button
              className="w-full bg-action hover:bg-action-pressed md:hover:scale-[0.98] text-on-primary font-label text-label py-3 px-6 rounded-DEFAULT transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2 focus:ring-offset-bg-card disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              disabled={resendLoading}
              onClick={handleResend}
              type="button"
            >
              {resendLoading ? 'Sending...' : 'Resend email'}
            </button>
            <button
              className="w-full bg-transparent border border-border-strong text-text-heading font-label text-label py-3 px-6 rounded-DEFAULT hover:bg-bg-raised transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2 focus:ring-offset-bg-card"
              onClick={onChangeEmail}
              type="button"
            >
              Change email address
            </button>
          </div>

          {/* Footer - Desktop Only */}
          <div className="mt-space-8 pt-space-6 border-t border-border-default w-full">
            <p className="font-label text-label text-text-muted">
              Didn't receive the email? Check your spam folder or contact{' '}
              <Link className="text-action hover:text-action-pressed underline transition-colors" href="/contact">
                support
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
