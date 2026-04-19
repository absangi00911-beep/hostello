"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { signupSchema, type SignupInput } from "@/lib/validations";
import { cn } from "@/lib/utils";

const INPUT =
  "w-full h-11 px-4 rounded-xl border border-[var(--color-border)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20 transition-all";

function SignupContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const defaultRole  = searchParams.get("role") === "owner" ? "OWNER" : "STUDENT";
  const [showPw, setShowPw]       = useState(false);
  const [serverErr, setServerErr] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: defaultRole },
  });

  const role = watch("role");

  async function onSubmit(data: SignupInput) {
    setServerErr("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerErr(json.error ?? "Signup failed. Please try again.");
        return;
      }
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) { router.push("/login"); return; }
      router.push(role === "OWNER" ? "/dashboard" : "/hostels");
      router.refresh();
    } catch {
      setServerErr("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="w-full max-w-100">

      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl font-extrabold text-(--color-ink)"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Create account
        </h1>
        <p className="mt-2 text-sm text-(--color-muted)">
          Already have one?{" "}
          <Link href="/login" className="font-semibold text-(--color-ink) underline underline-offset-2 hover:text-(--color-brand-700)">
            Sign in
          </Link>
        </p>
      </div>

      {/* Role toggle */}
      <div className="flex rounded-xl border border-border p-1 mb-6 bg-surface gap-1">
        {(["STUDENT", "OWNER"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setValue("role", r)}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all",
              role === r
                ? "bg-(--color-ink) text-white shadow-sm"
                : "text-(--color-muted) hover:text-(--color-ink)"
            )}
          >
            {r === "STUDENT" ? "I'm a student" : "I own a hostel"}
          </button>
        ))}
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

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-ink-soft mb-1.5">
              Full name
            </label>
            <input
              {...register("name")}
              autoComplete="name"
              placeholder="Ali Raza"
              className={INPUT}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink-soft mb-1.5">
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
          <label className="block text-sm font-semibold text-ink-soft mb-1.5">
            Phone <span className="text-(--color-muted) font-normal">(optional)</span>
          </label>
          <input
            {...register("phone")}
            type="tel"
            autoComplete="tel"
            placeholder="0300-1234567"
            className={INPUT}
          />
          {errors.phone && (
            <p className="mt-1.5 text-xs text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink-soft mb-1.5">
            Password
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
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-(--color-muted) hover:text-(--color-ink) transition-colors"
              aria-label={showPw ? "Hide" : "Show"}
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
          className="w-full h-11 rounded-xl bg-(--color-ink) text-white text-sm font-bold hover:bg-ink-soft disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>Create account <ArrowRight className="w-4 h-4" /></>
          )}
        </button>

        <p className="text-xs text-center text-(--color-muted)">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="underline hover:text-(--color-ink)">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="underline hover:text-(--color-ink)">Privacy Policy</Link>.
        </p>
      </form>
    </div>
  );
}

import { Suspense } from "react";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupContent />
    </Suspense>
  );
}
