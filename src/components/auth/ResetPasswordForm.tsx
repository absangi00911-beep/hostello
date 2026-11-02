"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  AuthNotice,
  authButtonClassName,
  authInputClassName,
  authLinkClassName,
} from "./AuthPageShell";
import { validateSignupPassword } from "./SignupForm";

export function ResetPasswordForm({ token }: { token: string | null }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    return (
      <div className="grid gap-4">
        <AuthNotice tone="error">
          This reset link is invalid or has expired. Request a new one to
          continue.
        </AuthNotice>
        <Link className={authButtonClassName} href="/forgot-password">
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="grid gap-4">
        <AuthNotice tone="success">
          Your password has been changed. You can log in now.
        </AuthNotice>
        <Link className={authButtonClassName} href="/login">
          Go to log in
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const passwordError = validateSignupPassword(password);
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setErrorMessage(
          typeof payload === "object" &&
            payload !== null &&
            typeof (payload as { error?: unknown }).error === "string"
            ? (payload as { error: string }).error
            : "We couldn't reset your password. Please try again.",
        );
        return;
      }
      setDone(true);
    } catch {
      setErrorMessage("We couldn't reset your password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {errorMessage ? <AuthNotice tone="error">{errorMessage}</AuthNotice> : null}
      <form className="grid gap-[14px]" noValidate onSubmit={handleSubmit}>
        <label className="grid gap-[6px] text-[0.875rem] font-semibold text-ink">
          <span>New password</span>
          <input
            autoComplete="new-password"
            autoFocus
            className={authInputClassName}
            name="password"
            onChange={(event) => setPassword(event.currentTarget.value)}
            required
            type="password"
            value={password}
          />
          <span className="text-[0.8rem] font-normal text-muted">
            At least 8 characters, with one uppercase letter and one number.
          </span>
        </label>
        <label className="grid gap-[6px] text-[0.875rem] font-semibold text-ink">
          <span>Confirm new password</span>
          <input
            autoComplete="new-password"
            className={authInputClassName}
            name="confirmPassword"
            onChange={(event) => setConfirmPassword(event.currentTarget.value)}
            required
            type="password"
            value={confirmPassword}
          />
        </label>
        <button
          className={authButtonClassName}
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Saving…" : "Change password"}
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
