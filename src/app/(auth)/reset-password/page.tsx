"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, CheckCircle2, ArrowRight, Loader2, AlertCircle } from "lucide-react";

const schema = z.object({
  password: z.string().min(8, "At least 8 characters"),
  confirm:  z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords don't match",
  path:    ["confirm"],
});
type Input = z.infer<typeof schema>;

const INPUT = "w-full h-11 px-4 rounded-xl border border-[var(--color-border)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20 transition-all";

function ResetPasswordContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") ?? "";

  const [done, setDone]   = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [serverErr, setServerErr] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<Input>({ resolver: zodResolver(schema) });

  if (!token) {
    return (
      <div className="w-full max-w-[400px] text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-extrabold text-[var(--color-ink)] mb-2" style={{ fontFamily: "var(--font-display)" }}>
          Invalid link
        </h1>
        <p className="text-sm text-[var(--color-muted)] mb-5">
          This reset link is missing or broken.
        </p>
        <Link href="/forgot-password" className="text-sm font-bold text-[var(--color-ink)] underline underline-offset-2">
          Request a new one
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="w-full max-w-[400px] text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-7 h-7 text-[var(--color-brand-700)]" />
        </div>
        <h1 className="text-2xl font-extrabold text-[var(--color-ink)] mb-2" style={{ fontFamily: "var(--font-display)" }}>
          Password updated
        </h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">
          You can now sign in with your new password.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-ink)] text-white text-sm font-bold hover:bg-[var(--color-ink-soft)] transition-colors"
        >
          Sign in <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  async function onSubmit(data: Input) {
    setServerErr("");
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password: data.password }),
      });
      const json = await res.json();
      if (!res.ok) { setServerErr(json.error ?? "Something went wrong."); return; }
      setDone(true);
    } catch {
      setServerErr("Something went wrong. Try again.");
    }
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[var(--color-ink)]" style={{ fontFamily: "var(--font-display)" }}>
          New password
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Choose something you haven't used before.
        </p>
      </div>

      {serverErr && (
        <div className="mb-5 flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {serverErr}
          {serverErr.includes("expired") && (
            <Link href="/forgot-password" className="font-semibold underline ml-1 shrink-0">
              Request a new link
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm font-semibold text-[var(--color-ink-soft)] mb-1.5">
            New password
          </label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className={`${INPUT} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--color-ink-soft)] mb-1.5">
            Confirm password
          </label>
          <input
            {...register("confirm")}
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Same as above"
            className={INPUT}
          />
          {errors.confirm && <p className="mt-1.5 text-xs text-red-600">{errors.confirm.message}</p>}
        </div>

        <button
          type="submit" disabled={isSubmitting}
          className="w-full h-11 rounded-xl bg-[var(--color-ink)] text-white text-sm font-bold hover:bg-[var(--color-ink-soft)] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mt-2"
        >
          {isSubmitting
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <><ArrowRight className="w-4 h-4" /> Update password</>
          }
        </button>
      </form>
    </div>
  );
}

import { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
