"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  AuthNotice,
  authButtonClassName,
  authInputClassName,
  authLinkClassName,
} from "./AuthPageShell";

export type SignupRole = "STUDENT" | "OWNER";

function readFirstFieldError(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const details = (payload as { details?: unknown }).details;
  if (typeof details !== "object" || details === null) return null;
  const fieldErrors = (details as { fieldErrors?: unknown }).fieldErrors;
  if (typeof fieldErrors !== "object" || fieldErrors === null) return null;
  for (const messages of Object.values(fieldErrors)) {
    if (Array.isArray(messages) && typeof messages[0] === "string") {
      return messages[0];
    }
  }
  return null;
}

function readApiError(payload: unknown): string | null {
  return typeof payload === "object" &&
    payload !== null &&
    typeof (payload as { error?: unknown }).error === "string"
    ? (payload as { error: string }).error
    : null;
}

export function validateSignupPassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Include at least one uppercase letter.";
  if (!/[0-9]/.test(password)) return "Include at least one number.";
  return null;
}

export function SignupForm({ initialRole }: { initialRole: SignupRole }) {
  const [role, setRole] = useState<SignupRole>(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);

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
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          confirmPassword,
          role,
        }),
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorMessage(
          readFirstFieldError(payload) ??
            readApiError(payload) ??
            "We couldn't create your account. Please try again.",
        );
        return;
      }

      setCreatedEmail(email.trim());
    } catch {
      setErrorMessage("We couldn't create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (createdEmail) {
    return (
      <div className="grid gap-4">
        <AuthNotice tone="success">
          Check your inbox. We sent an email to {createdEmail}. Follow the link
          in it to verify your email, then log in.
        </AuthNotice>
        <Link className={authButtonClassName} href="/login">
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <>
      {errorMessage ? <AuthNotice tone="error">{errorMessage}</AuthNotice> : null}
      <form className="grid gap-[14px]" noValidate onSubmit={handleSubmit}>
        <fieldset className="m-0 grid gap-[6px] border-0 p-0">
          <legend className="mb-[6px] p-0 text-[0.875rem] font-semibold text-ink">
            I am a
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["STUDENT", "Student"],
                ["OWNER", "Hostel owner"],
              ] as const
            ).map(([value, label]) => (
              <label
                className="flex min-h-[50px] cursor-pointer items-center justify-center gap-2 rounded-[8px] border border-line bg-white text-[0.95rem] font-semibold text-ink has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand-dark"
                key={value}
              >
                <input
                  checked={role === value}
                  className="sr-only"
                  name="role"
                  onChange={() => setRole(value)}
                  type="radio"
                  value={value}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="grid gap-[6px] text-[0.875rem] font-semibold text-ink">
          <span>Full name</span>
          <input
            autoComplete="name"
            className={authInputClassName}
            maxLength={80}
            name="name"
            onChange={(event) => setName(event.currentTarget.value)}
            required
            type="text"
            value={name}
          />
        </label>

        <label className="grid gap-[6px] text-[0.875rem] font-semibold text-ink">
          <span>Email</span>
          <input
            autoComplete="email"
            className={authInputClassName}
            name="email"
            onChange={(event) => setEmail(event.currentTarget.value)}
            required
            type="email"
            value={email}
          />
        </label>

        <label className="grid gap-[6px] text-[0.875rem] font-semibold text-ink">
          <span>
            Phone <span className="font-normal text-muted">(optional)</span>
          </span>
          <input
            autoComplete="tel"
            className={authInputClassName}
            inputMode="tel"
            name="phone"
            onChange={(event) => setPhone(event.currentTarget.value)}
            placeholder="03001234567"
            type="tel"
            value={phone}
          />
        </label>

        <label className="grid gap-[6px] text-[0.875rem] font-semibold text-ink">
          <span>Password</span>
          <input
            autoComplete="new-password"
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
          <span>Confirm password</span>
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
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mb-0 mt-5 text-center text-[0.9rem] text-muted">
        Already have an account?{" "}
        <Link className={authLinkClassName} href="/login">
          Log in
        </Link>
      </p>
    </>
  );
}
