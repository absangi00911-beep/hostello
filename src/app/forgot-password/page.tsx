// Path: src/app/forgot-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import {
  AuthCardLayout,
  FormField,
  inputCls,
  primaryBtnCls,
} from "@/components/auth/AuthCardLayout";

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthCardLayout
        heading="Check your email"
        footer={
          <Link href="/login" className="text-[var(--color-text-link)] hover:underline">
            Back to sign in
          </Link>
        }
      >
        <div className="text-center space-y-4">
          <CheckCircle2
            size={44}
            strokeWidth={1.5}
            className="text-[var(--color-action)] mx-auto"
            aria-hidden="true"
          />
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-body)] leading-relaxed">
            If an account exists for{" "}
            <strong className="font-[500]">{email}</strong>, we've sent a
            password reset link. It expires in 30 minutes.
          </p>
          <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
            Didn't receive it? Check your spam folder.
          </p>
        </div>
      </AuthCardLayout>
    );
  }

  return (
    <AuthCardLayout
      heading="Reset your password"
      subheading="Enter your email and we'll send a reset link."
      footer={
        <Link href="/login" className="text-[var(--color-text-link)] hover:underline">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="rounded-[var(--radius-md)] bg-[var(--color-error-bg)] border border-[oklch(0.52_0.18_22_/_0.2)] px-4 py-3 text-[var(--text-body-sm)] text-[var(--color-error-text)]">
            {error}
          </div>
        )}
        <FormField id="email" label="Email">
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading}
            className={inputCls}
          />
        </FormField>
        <button
          type="submit"
          disabled={loading || !email}
          className={primaryBtnCls}
        >
          {loading && <Loader2 size={16} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />}
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthCardLayout>
  );
}
