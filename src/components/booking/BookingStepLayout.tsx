// Path: src/components/booking/BookingStepLayout.tsx
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Logo } from "@/components/Logo";

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
            <Logo size="compact" aria-label="HostelLo home" />
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
