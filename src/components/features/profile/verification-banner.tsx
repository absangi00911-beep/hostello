"use client";

import { useState } from "react";
import { MailOpen, X, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface VerificationBannerProps {
  email: string;
}

export function VerificationBanner({ email }: VerificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (dismissed) return null;

  async function handleResend() {
    setSending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to send email");
      setSent(true);
      toast.success("Verification email sent — check your inbox.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3">
        <MailOpen className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800 flex-1 min-w-0">
          <span className="font-semibold">Verify your email</span>
          {" — "}
          <span className="hidden sm:inline">
            We sent a link to <span className="font-medium">{email}</span>.{" "}
          </span>
          {sent ? (
            <span className="inline-flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              Email sent — check your inbox.
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={sending}
              className="font-semibold underline underline-offset-2 hover:text-amber-900 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
            >
              {sending && <Loader2 className="w-3 h-3 animate-spin" />}
              Resend verification email
            </button>
          )}
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-amber-600 hover:text-amber-900 transition-colors rounded"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
