// Path: src/app/verify-email-sent/ResendButton.tsx
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

export function ResendVerificationButton() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  async function handleResend() {
    setLoading(true);
    setError("");
    try {
      const res  = await fetch("/api/auth/resend-verification", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: session?.user?.email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to resend. Try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <p className="text-[var(--text-body-sm)] text-[var(--color-success)]">
        Verification email resent.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-[var(--text-body-sm)] text-[var(--color-error)]">{error}</p>
      )}
      <button
        onClick={handleResend}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-[var(--text-body-sm)] text-[var(--color-text-link)] hover:underline focus-visible:underline focus-visible:outline-none disabled:opacity-50"
      >
        {loading && <Loader2 size={13} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />}
        {loading ? "Sending…" : "Resend verification email"}
      </button>
    </div>
  );
}
