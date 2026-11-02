"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  AuthNotice,
  authButtonClassName,
  authInputClassName,
  authLinkClassName,
} from "./AuthPageShell";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(
          typeof payload === "object" &&
            payload !== null &&
            typeof (payload as { error?: unknown }).error === "string"
            ? (payload as { error: string }).error
            : "We couldn't send the reset link. Please try again.",
        );
        return;
      }
      setSent(true);
    } catch {
      setErrorMessage("We couldn't send the reset link. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="grid gap-4">
        <AuthNotice tone="success">
          If an account exists for that email, a reset link is on its way. The
          link expires in 30 minutes.
        </AuthNotice>
        <Link className={authButtonClassName} href="/login">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <>
      {errorMessage ? <AuthNotice tone="error">{errorMessage}</AuthNotice> : null}
      <form className="grid gap-[14px]" noValidate onSubmit={handleSubmit}>
        <label className="grid gap-[6px] text-[0.875rem] font-semibold text-ink">
          <span>Email</span>
          <input
            autoComplete="email"
            autoFocus
            className={authInputClassName}
            name="email"
            onChange={(event) => setEmail(event.currentTarget.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <button
          className={authButtonClassName}
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="mb-0 mt-5 text-center text-[0.9rem] text-muted">
        <Link className={authLinkClassName} href="/login">
          Back to log in
        </Link>
      </p>
    </>
  );
}
