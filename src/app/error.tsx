// Path: src/app/error.tsx
"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to monitoring (Sentry etc.) in production
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-dvh bg-[var(--color-bg-page)] flex flex-col items-center justify-center px-4 text-center">
      {/* Error icon — same large treatment as 404 but smaller */}
      <p
        className="select-none leading-none mb-6 text-[var(--color-primary-faint)]"
        style={{
          fontFamily:  "var(--font-heading)",
          fontSize:    "clamp(60px, 14vw, 96px)",
          fontWeight:  800,
          letterSpacing: "-0.04em",
        }}
        aria-hidden="true"
      >
        500
      </p>

      {/* Heading — honest, no "Oops" */}
      <h1
        className="text-[var(--text-h3)] font-[600] text-[var(--color-text-heading)] mb-3"
        style={{ fontFamily: "var(--font-body)" }}
      >
        Something went wrong
      </h1>

      {/* Description — brief, honest per spec */}
      <p className="text-[var(--text-body)] text-[var(--color-text-muted)] max-w-[40ch] mb-8 leading-relaxed">
        We&apos;ve been notified. Try again in a moment.
      </p>

      {/* One button: reload */}
      <button
        onClick={reset}
        className="inline-flex items-center h-11 px-6 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-inverse)] transition-all duration-[var(--transition-base)] hover:bg-[var(--color-action-dark)] active:bg-[var(--color-action-pressed)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-[var(--color-action-light)] focus-visible:outline-offset-2"
      >
        Reload page
      </button>

      {/* Digest for support reference — subtle, not alarming */}
      {error.digest && (
        <p className="mt-6 text-[var(--text-caption)] text-[var(--color-text-muted)]">
          Error reference:{" "}
          <code className="font-[var(--font-mono)] text-[var(--color-text-muted)]">
            {error.digest}
          </code>
        </p>
      )}
    </div>
  );
}
