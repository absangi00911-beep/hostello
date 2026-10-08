// Path: src/app/reset-password/page.tsx
"use client";

export const dynamic = "force-dynamic";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AuthCardLayout,
  FormField,
  inputCls,
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
        <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-error)]">
          Invalid or expired reset link.
        </p>
        <Link href="/forgot-password" className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-link)] hover:underline">
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
        <CheckCircle2 size={44} strokeWidth={1.5} className="text-[color:var(--color-action)] mx-auto" aria-hidden="true" />
        <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)]">
          Password updated. Redirecting you to sign in…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {apiError && (
        <div role="alert" className="rounded-[var(--radius-md)] bg-[var(--color-error-bg)] border border-[var(--color-error)]/20 px-4 py-3 text-[length:var(--text-body-sm)] text-[color:var(--color-error-text)]">
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-body)]"
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? <EyeOff size={16} strokeWidth={1.5} aria-hidden="true" /> : <Eye size={16} strokeWidth={1.5} aria-hidden="true" />}
          </Button>
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

      <Button type="submit" loading={loading} disabled={loading || !password || !confirm} className="w-full">
        {loading ? "Updating…" : "Set new password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCardLayout
      heading="Set new password"
      footer={
        <Link href="/login" className="text-[color:var(--color-text-link)] hover:underline">
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