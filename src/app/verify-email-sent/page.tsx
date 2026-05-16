// Path: src/app/verify-email-sent/page.tsx
import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthCardLayout } from "@/components/auth/AuthCardLayout";
import { ResendVerificationButton } from "./ResendButton";

export default function VerifyEmailSentPage() {
  return (
    <AuthCardLayout
      heading="Check your inbox"
      footer={
        <Link href="/login" className="text-[var(--color-text-link)] hover:underline">
          Back to sign in
        </Link>
      }
    >
      <div className="text-center space-y-5">
        <div className="flex justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-faint)]">
            <Mail size={32} strokeWidth={1.5} className="text-[var(--color-primary)]" aria-hidden="true" />
          </span>
        </div>
        <div className="space-y-2">
          <p className="text-[var(--text-body)] text-[var(--color-text-body)] leading-relaxed">
            We've sent a verification link to your email address. Click the link
            to activate your account.
          </p>
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
            The link expires in 24 hours. Check your spam folder if you don't
            see it.
          </p>
        </div>
        <ResendVerificationButton />
      </div>
    </AuthCardLayout>
  );
}