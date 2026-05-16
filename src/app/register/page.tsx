// Path: src/app/register/page.tsx
"use client";

export const dynamic = "force-dynamic";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Loader2, Eye, EyeOff, GraduationCap, Building2 } from "lucide-react";
import {
  AuthCardLayout,
  FormField,
  inputCls,
  primaryBtnCls,
} from "@/components/auth/AuthCardLayout";

type Role = "STUDENT" | "OWNER";

/* ── Password strength indicator ────────────────────────── */
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score  = checks.filter(Boolean).length;
  const labels = ["Weak", "Fair", "Good", "Strong"];
  const colors = [
    "bg-[var(--color-error)]",
    "bg-[var(--color-warning)]",
    "bg-[var(--color-primary)]",
    "bg-[var(--color-success)]",
  ];

  return (
    <div className="space-y-1.5 mt-1.5" aria-live="polite" aria-label={`Password strength: ${labels[score - 1] ?? "Weak"}`}>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`h-1 flex-1 rounded-full transition-colors duration-[var(--transition-base)] ${
              n <= score ? colors[score - 1] : "bg-[var(--color-border-subtle)]"
            }`}
          />
        ))}
      </div>
      <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
        {score > 0 ? labels[score - 1] : ""}
      </p>
    </div>
  );
}

function RegisterForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const defaultRole  = searchParams.get("role") === "OWNER" ? "OWNER" : "STUDENT";

  const [role,     setRole]     = useState<Role>(defaultRole);
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim())              e.name     = "Enter your full name.";
    if (!email.includes("@"))      e.email    = "Enter a valid email address.";
    if (password.length < 8)       e.password = "Password must be at least 8 characters.";
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
      const res  = await fetch("/api/auth/signup", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:     name.trim(),
          email:    email.trim().toLowerCase(),
          password,
          role,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setErrors({ email: "Email already registered. Sign in instead, or reset your password." });
        } else {
          setApiError(json.error ?? "Registration failed. Please try again.");
        }
        return;
      }

      // Auto sign-in after registration
      const signInRes = await signIn("credentials", {
        email:    email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (signInRes?.ok) {
        router.push("/verify-email-sent");
      } else {
        // Sign-in failed but account was created — send to login
        router.push(`/login?registered=1&email=${encodeURIComponent(email)}`);
      }
    } catch {
      setApiError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCardLayout
      heading="Create account"
      subheading="Find your room. Not a phone number."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[var(--color-text-link)] hover:underline focus-visible:underline focus-visible:outline-none"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Global error */}
        {apiError && (
          <div
            role="alert"
            className="rounded-[var(--radius-md)] bg-[var(--color-error-bg)] border border-[oklch(0.52_0.18_22_/_0.2)] px-4 py-3 text-[var(--text-body-sm)] text-[var(--color-error-text)]"
          >
            {apiError}
          </div>
        )}

        {/* Role toggle — student vs owner */}
        <div>
          <p className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)] mb-2">
            I am a
          </p>
          <div
            className="grid grid-cols-2 gap-2"
            role="radiogroup"
            aria-label="Account type"
          >
            {(
              [
                { value: "STUDENT" as Role, label: "Student", icon: GraduationCap },
                { value: "OWNER"   as Role, label: "Hostel owner", icon: Building2 },
              ] as const
            ).map(({ value, label, icon: Icon }) => (
              <label
                key={value}
                className={`
                  flex items-center gap-2.5 rounded-[var(--radius-md)] border-2 px-3 py-2.5 cursor-pointer
                  transition-all duration-[var(--transition-base)]
                  ${
                    role === value
                      ? "border-[var(--color-action)] bg-[var(--color-action-light)]"
                      : "border-[var(--color-border-default)] bg-[var(--color-bg-card)] hover:border-[var(--color-border-strong)]"
                  }
                `}
              >
                <input
                  type="radio"
                  name="role"
                  value={value}
                  checked={role === value}
                  onChange={() => setRole(value)}
                  className="sr-only"
                />
                <Icon
                  size={16}
                  strokeWidth={1.5}
                  className={role === value ? "text-[var(--color-action)]" : "text-[var(--color-text-muted)]"}
                  aria-hidden="true"
                />
                <span
                  className={`text-[var(--text-body-sm)] font-[500] ${
                    role === value
                      ? "text-[var(--color-action-dark)]"
                      : "text-[var(--color-text-body)]"
                  }`}
                >
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Full name */}
        <FormField id="name" label="Full name" error={errors.name}>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Hamza Ahmed"
            required
            disabled={loading}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={inputCls}
          />
        </FormField>

        {/* Email */}
        <FormField id="email" label="Email" error={errors.email}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={loading}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={inputCls}
          />
        </FormField>

        {/* Password */}
        <FormField id="password" label="Password" error={errors.password}>
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
              {showPw ? (
                <EyeOff size={16} strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <Eye size={16} strokeWidth={1.5} aria-hidden="true" />
              )}
            </button>
          </div>
          {/* Strength indicator — visible as user types, no error state */}
          <PasswordStrength password={password} />
        </FormField>

        {/* Terms note */}
        <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] text-center">
          By registering, you agree to our{" "}
          <Link href="/terms" className="text-[var(--color-text-link)] hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-[var(--color-text-link)] hover:underline">
            Privacy Policy
          </Link>
          .
        </p>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !name || !email || !password}
          className={primaryBtnCls}
        >
          {loading && (
            <Loader2 size={16} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
          )}
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthCardLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}