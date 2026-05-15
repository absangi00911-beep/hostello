// Path: src/app/reset-password/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import {
  AuthCardLayout,
  FormField,
  inputCls,
  primaryBtnCls,
} from "@/components/auth/AuthCardLayout";

function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") ?? "";

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [errors,    setErrors]    = useState<Record<string, string>>({});
  const [apiError,  setApiError]  = useState("");

  if (!token) {
    return (
      <div className="text-center space-y-3">
        <p className="text-[var(--text-body-sm)] text-[var(--color-error)]">
          Invalid or expired reset link.
        </p>
        <Link href="/forgot-password" className="text-[var(--text-body-sm)] text-[var(--color-text-link)] hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  function validate() {
    const e: Record<string, string> = {};
    if (password.length < 8)        e.password = "Password must be at least 8 characters.";
    if (password !== confirm)        e.confirm  = "Passwords don't match.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setApiError(json.error ?? "Reset failed. The link may have expired.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setApiError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle2 size={44} strokeWidth={1.5} className="text-[var(--color-action)] mx-auto" aria-hidden="true" />
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-body)]">
          Password updated. Redirecting you to sign in…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {apiError && (
        <div role="alert" className="rounded-[var(--radius-md)] bg-[var(--color-error-bg)] border border-[oklch(0.52_0.18_22_/_0.2)] px-4 py-3 text-[var(--text-body-sm)] text-[var(--color-error-text)]">
          {apiError}
        </div>
      )}

      <FormField id="password" label="New password" error={errors.password}>
        <div className="relative">
          <input
            id="password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            disabled={loading}
            aria-invalid={!!errors.password}
            className={`${inputCls} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-body)] transition-colors duration-[var(--transition-fast)]"
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? <EyeOff size={16} strokeWidth={1.5} aria-hidden="true" /> : <Eye size={16} strokeWidth={1.5} aria-hidden="true" />}
          </button>
        </div>
      </FormField>

      <FormField id="confirm" label="Confirm new password" error={errors.confirm}>
        <input
          id="confirm"
          type={showPw ? "text" : "password"}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Same password again"
          required
          disabled={loading}
          aria-invalid={!!errors.confirm}
          className={inputCls}
        />
      </FormField>

      <button type="submit" disabled={loading || !password || !confirm} className={primaryBtnCls}>
        {loading && <Loader2 size={16} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />}
        {loading ? "Updating…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCardLayout
      heading="Set new password"
      footer={
        <Link href="/login" className="text-[var(--color-text-link)] hover:underline">
          Back to sign in
        </Link>
      }
    >
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCardLayout>
  );
}