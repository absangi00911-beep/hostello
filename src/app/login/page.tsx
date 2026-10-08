// Path: src/app/login/page.tsx
"use client";

export const dynamic = "force-dynamic";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AuthCardLayout,
  FormField,
  inputCls,
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
            className="text-[color:var(--color-text-link)] hover:underline focus-visible:underline focus-visible:outline-none"
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
            className="rounded-[var(--radius-md)] bg-[var(--color-error-bg)] border border-[var(--color-error)]/20 px-4 py-3 text-[length:var(--text-body-sm)] text-[color:var(--color-error-text)]"
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
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-body)]"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? (
                <EyeOff size={16} strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <Eye size={16} strokeWidth={1.5} aria-hidden="true" />
              )}
            </Button>
          </div>
        </FormField>

        {/* Forgot password */}
        <div className="flex justify-end -mt-1">
          <Link
            href="/forgot-password"
            className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-link)] hover:underline focus-visible:underline focus-visible:outline-none"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <Button type="submit" loading={loading} disabled={loading || !email || !password} className="mt-2 w-full">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
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
