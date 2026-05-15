// Path: src/components/auth/AuthCardLayout.tsx
import Link from "next/link";

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
    <div className="min-h-dvh bg-[var(--color-bg-page)] flex flex-col items-center justify-center px-4 py-12">
      {/* Card */}
      <div className="w-full max-w-[440px]">
        {/* Logo — centered above card */}
        <div className="flex justify-center mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2 rounded-[var(--radius-sm)]"
            aria-label="HostelLo home"
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect x="2" y="8" width="16" height="18" rx="2" fill="var(--color-primary)" />
              <rect x="10" y="2" width="16" height="18" rx="2" fill="var(--color-primary-deep)" opacity="0.7" />
              <rect x="6" y="16" width="4" height="6" rx="1" fill="var(--color-bg-page)" />
            </svg>
            <span
              className="text-[1.25rem] font-[700] tracking-[-0.02em] text-[var(--color-text-heading)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              HostelLo
            </span>
          </Link>
        </div>

        {/* Card surface */}
        <div className="rounded-[var(--radius-lg)] bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-md)] p-9">
          {/* Heading */}
          <div className="text-center mb-7">
            <h1
              className="text-[var(--text-h3)] font-[600] text-[var(--color-text-heading)] mb-1"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {heading}
            </h1>
            {subheading && (
              <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
                {subheading}
              </p>
            )}
          </div>

          {/* Content */}
          {children}
        </div>

        {/* Footer link */}
        {footer && (
          <p className="mt-5 text-center text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Shared form field wrapper ───────────────────────────── */
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

/* ── Shared text input ───────────────────────────────────── */
export const inputCls =
  "h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-3.5 text-[var(--text-body-sm)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-placeholder)] transition-all duration-[var(--transition-base)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[oklch(0.62_0.17_65_/_0.15)] aria-[invalid=true]:border-[var(--color-error)] aria-[invalid=true]:ring-[oklch(0.52_0.18_22_/_0.12)]";

/* ── Primary action button ───────────────────────────────── */
export const primaryBtnCls =
  "inline-flex w-full items-center justify-center gap-2 h-11 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-inverse)] transition-all duration-[var(--transition-base)] hover:bg-[var(--color-action-dark)] active:bg-[var(--color-action-pressed)] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--color-action-light)] focus-visible:outline-offset-2";

/* ── Or divider ──────────────────────────────────────────── */
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