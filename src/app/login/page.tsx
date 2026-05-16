// Path: src/app/login/page.tsx
"use client";

export const dynamic = "force-dynamic";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import {
  AuthCardLayout,
  FormField,
  OrDivider,
  inputCls,
  primaryBtnCls,
} from "@/components/auth/AuthCardLayout";

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin:  "Email or password is incorrect.",
  EmailSignin:        "Could not send sign-in email.",
  OAuthSignin:        "Sign-in failed. Try again.",
  OAuthCallback:      "Sign-in failed. Try again.",
  Default:            "Something went wrong. Please try again.",
};

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") ?? "/";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email:    email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (!res || res.error) {
      const code = res?.error ?? "Default";
      setError(ERROR_MESSAGES[code] ?? ERROR_MESSAGES.Default);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <AuthCardLayout
      heading="Sign in"
      subheading="Welcome back to HostelLo"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-[var(--color-text-link)] hover:underline focus-visible:underline focus-visible:outline-none"
          >
            Register
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Global error */}
        {error && (
          <div
            role="alert"
            className="rounded-[var(--radius-md)] bg-[var(--color-error-bg)] border border-[oklch(0.52_0.18_22_/_0.2)] px-4 py-3 text-[var(--text-body-sm)] text-[var(--color-error-text)]"
          >
            {error}
          </div>
        )}

        {/* Email */}
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

        {/* Password */}
        <FormField id="password" label="Password">
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              disabled={loading}
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
        </FormField>

        {/* Forgot password */}
        <div className="flex justify-end -mt-1">
          <Link
            href="/forgot-password"
            className="text-[var(--text-body-sm)] text-[var(--color-text-link)] hover:underline focus-visible:underline focus-visible:outline-none"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !email || !password}
          className={`${primaryBtnCls} mt-2`}
        >
          {loading && (
            <Loader2 size={16} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
          )}
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthCardLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}