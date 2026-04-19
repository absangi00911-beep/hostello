"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations";

const INPUT =
  "w-full h-11 px-4 rounded-xl border border-[var(--color-border)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20 transition-all";

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
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="w-full max-w-[400px]">

      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-extrabold text-[var(--color-ink)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Sign in
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Don't have an account?{" "}
          <Link href="/signup" className="font-semibold text-[var(--color-ink)] underline underline-offset-2 hover:text-[var(--color-brand-700)]">
            Create one
          </Link>
        </p>
      </div>

      {/* Error */}
      {serverErr && (
        <div className="mb-5 flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
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
            className={INPUT}
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
              className={`${INPUT} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
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
