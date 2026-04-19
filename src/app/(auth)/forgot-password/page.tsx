"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

const schema = z.object({ email: z.string().email("Enter a valid email") });
type Input   = z.infer<typeof schema>;

const INPUT = "w-full h-11 px-4 rounded-xl border border-[var(--color-border)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20 transition-all";

export default function ForgotPasswordPage() {
  const [sent, setSent]   = useState(false);
  const [email, setEmail] = useState("");
  const [serverErr, setServerErr] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<Input>({ resolver: zodResolver(schema) });

  async function onSubmit(data: Input) {
    setServerErr("");
    try {
      const res  = await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { setServerErr(json.error ?? "Something went wrong."); return; }
      setEmail(data.email);
      setSent(true);
    } catch {
      setServerErr("Something went wrong. Try again.");
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-[400px] text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-7 h-7 text-[var(--color-brand-700)]" />
        </div>
        <h1 className="text-2xl font-extrabold text-[var(--color-ink)] mb-2" style={{ fontFamily: "var(--font-display)" }}>
          Check your inbox
        </h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">
          We sent a reset link to <strong className="text-[var(--color-ink)]">{email}</strong>. It expires in 30 minutes.
        </p>
        <Link href="/login" className="text-sm font-semibold text-[var(--color-ink)] hover:text-[var(--color-brand-700)] transition-colors">
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[var(--color-ink)]" style={{ fontFamily: "var(--font-display)" }}>
          Forgot password?
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      {serverErr && (
        <div className="mb-5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3.5">
          {serverErr}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm font-semibold text-[var(--color-ink-soft)] mb-1.5">Email</label>
          <input {...register("email")} type="email" autoComplete="email" placeholder="you@example.com" className={INPUT} />
          {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <button
          type="submit" disabled={isSubmitting}
          className="w-full h-11 rounded-xl bg-[var(--color-ink)] text-white text-sm font-bold hover:bg-[var(--color-ink-soft)] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Send reset link</>}
        </button>
      </form>

      <p className="mt-5 text-sm text-center text-[var(--color-muted)]">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-[var(--color-ink)] underline underline-offset-2 hover:text-[var(--color-brand-700)]">
          Sign in
        </Link>
      </p>
    </div>
  );
}
