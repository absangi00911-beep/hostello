"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { FORM_INPUT } from "@/lib/form-constants";

function LoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl  = searchParams.get("callbackUrl") ?? "/";
  const [showPw, setShowPw]       = useState(false);
  const [serverErr, setServerErr] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    setServerErr("");
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    if (result?.error) {
      setServerErr("That email and password combination doesn't match.");
      return;
    }

    // Validate callbackUrl is a same-origin path to prevent open redirect attacks.
    // A simple startsWith("/") check does NOT stop /\evil.com or encoded variants.
    // Parsing with the URL constructor and comparing origins is the only safe approach.
    let safeUrl = "/dashboard";
    try {
      const resolved = new URL(callbackUrl, window.location.origin);
      if (resolved.origin === window.location.origin) {
        safeUrl = resolved.pathname + resolved.search + resolved.hash;
      }
    } catch {
      // malformed URL — fall through to default
    }

    router.push(safeUrl);
    router.refresh();
  }

  return (
    <div className="w-full max-w-100">

      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-extrabold text-[var(--color-ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Sign in
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-[var(--color-ink)] underline underline-offset-2 hover:text-[var(--color-brand-700)]">
            Create one
          </Link>
        </p>
      </div>

      {/* Error */}
      {serverErr && (
        <div className="mb-5 flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {serverErr}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-ink-soft)] mb-1.5">
            Email
          </label>
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={FORM_INPUT}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-semibold text-[var(--color-ink-soft)]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
            >
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <input
              {...register("password")}
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`${FORM_INPUT} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-0.5 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 rounded-xl bg-[var(--color-ink)] text-white text-sm font-bold hover:bg-[var(--color-ink-soft)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>Sign in <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>
    </div>
  );
}

import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}