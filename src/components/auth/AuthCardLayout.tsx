// Path: src/components/auth/AuthCardLayout.tsx
import { Logo } from "@/components/Logo";
import { inputCls } from "@/components/ui/input";
import Image from "next/image";
import { ArrowRight, ShieldCheck } from "lucide-react";

const AUTH_IMAGE =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&q=80&auto=format&fit=crop";

interface AuthCardLayoutProps {
  heading: string;
  subheading?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function AuthCardLayout({
  heading,
  subheading,
  footer,
  children,
}: AuthCardLayoutProps) {
  return (
    <div className="min-h-dvh bg-[var(--color-bg-page)] px-4 py-8 sm:px-6 lg:flex lg:items-center lg:justify-center lg:py-12">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center">
        <aside className="relative hidden min-h-[600px] overflow-hidden rounded-[var(--radius-brand)] bg-[var(--color-text-heading)] lg:flex">
          <Image
            src={AUTH_IMAGE}
            alt="Students walking together across a university campus"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 0px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/20" aria-hidden="true" />
          <div className="relative mt-auto p-10">
            <p className="text-[var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-white/70">
              Welcome back
            </p>
            <p className="mt-3 max-w-md font-heading text-[2.25rem] leading-[1.05] font-[600] text-white">
              Your next room is closer than you think.
            </p>
            <div className="mt-6 flex items-center gap-2 text-[var(--text-body-sm)] text-white/80">
              <ShieldCheck size={16} strokeWidth={1.6} aria-hidden="true" />
              Verified listings and clear monthly prices
              <ArrowRight size={14} strokeWidth={1.6} aria-hidden="true" />
            </div>
          </div>
        </aside>

        <div className="w-full max-w-[440px] justify-self-center">
          <div className="mb-7 flex justify-center">
            <Logo />
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-6 shadow-[var(--shadow-md)] sm:p-8">
          {/* Heading */}
          <div className="text-center mb-7">
            <h1 className="font-heading text-[var(--text-h3)] font-[600] text-[var(--color-text-heading)] mb-1">
              {heading}
            </h1>
            {subheading && (
              <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
                {subheading}
              </p>
            )}
          </div>

          {children}
          </div>

          {footer && (
            <p className="mt-5 text-center text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
              {footer}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* -- Shared form field wrapper ----------------------------- */
interface FormFieldProps {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ id, label, optional, error, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-[var(--text-label)] font-[500] text-[var(--color-text-body)]"
        >
          {label}
        </label>
        {optional && (
          <span className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
            (optional)
          </span>
        )}
      </div>
      {children}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-center gap-1.5 text-[var(--text-body-sm)] text-[var(--color-error)]"
        >
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}

/*
 * Re-export inputCls from the canonical source (ui/input).
 * Any file that was importing inputCls from AuthCardLayout can continue to do
 * so without breaking — this re-export acts as a backwards-compatible bridge.
 */
export { inputCls };

/* -- Primary action button --------------------------------- */
export const primaryBtnCls =
  "inline-flex w-full items-center justify-center gap-2 h-11 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-inverse)] transition-all duration-[var(--transition-base)] hover:bg-[var(--color-action-dark)] active:bg-[var(--color-action-pressed)] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--color-action-light)] focus-visible:outline-offset-2";

/* -- Or divider -------------------------------------------- */
export function OrDivider() {
  return (
    <div className="relative my-5 flex items-center">
      <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
      <span className="mx-3 text-[var(--text-caption)] text-[var(--color-text-muted)] bg-[var(--color-bg-card)]">
        or
      </span>
      <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
    </div>
  );
}
