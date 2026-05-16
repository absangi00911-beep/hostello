// Path: src/components/booking/BookingStepLayout.tsx
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const TOTAL_STEPS = 3;
const STEP_LABELS = ["Review booking", "Payment", "Confirmation"];

interface BookingStepLayoutProps {
  step: 1 | 2 | 3;
  backHref?: string;
  children: React.ReactNode;
}

export function BookingStepLayout({
  step,
  backHref,
  children,
}: BookingStepLayoutProps) {
  const progress = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="min-h-dvh bg-[var(--color-bg-page)]">
      {/* -- Top progress bar — 4px amber, full width ---- */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-1 bg-[var(--color-border-subtle)]"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-label={`Step ${step} of ${TOTAL_STEPS}`}
      >
        <div
          className="h-full rounded-r-full bg-[var(--color-primary)] transition-all duration-[var(--transition-slow)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* -- Minimal top bar ----------------------------- */}
      <header className="sticky top-1 z-40 flex h-14 items-center border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/95 backdrop-blur-sm px-4">
        <div className="flex w-full max-w-[640px] mx-auto items-center gap-3">
          {/* Back button */}
          {backHref ? (
            <Link
              href={backHref}
              className="flex items-center gap-1 text-[var(--text-body-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-body)] transition-colors duration-[var(--transition-fast)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2 rounded-[var(--radius-sm)]"
            >
              <ChevronLeft size={16} strokeWidth={1.5} aria-hidden="true" />
              Back
            </Link>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2 rounded-[var(--radius-sm)]"
              aria-label="HostelLo home"
            >
              <svg width="20" height="20" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <rect x="2" y="8" width="16" height="18" rx="2" fill="var(--color-primary)" />
                <rect x="10" y="2" width="16" height="18" rx="2" fill="var(--color-primary-deep)" opacity="0.7" />
                <rect x="6" y="16" width="4" height="6" rx="1" fill="var(--color-bg-card)" />
              </svg>
              <span
                className="text-[0.9375rem] font-[700] tracking-[-0.02em] text-[var(--color-text-heading)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                HostelLo
              </span>
            </Link>
          )}

          <div className="flex-1" />

          {/* Step counter */}
          <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
            Step {step} of {TOTAL_STEPS} —{" "}
            <span className="font-[500] text-[var(--color-text-body)]">
              {STEP_LABELS[step - 1]}
            </span>
          </p>
        </div>
      </header>

      {/* -- Page content — centered, max 640px --------- */}
      <main
        className="mx-auto w-full max-w-[640px] px-4 py-8 pb-16"
        id="main-content"
      >
        {children}
      </main>
    </div>
  );
}
