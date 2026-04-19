"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to your error tracker here (e.g. Sentry)
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--color-background)]">
          <div className="text-center max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h1
              className="text-xl font-bold text-[var(--color-text)] mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Something went wrong
            </h1>
            <p className="text-sm text-[var(--color-muted)] mb-6">
              An unexpected error occurred. If it keeps happening, contact support.
            </p>
            {error.digest && (
              <p className="text-xs text-[var(--color-muted)] font-mono mb-6 bg-[var(--color-sand-100)] px-3 py-1.5 rounded-lg inline-block">
                Error ID: {error.digest}
              </p>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary-900)] text-white text-sm font-semibold hover:bg-[var(--color-primary-800)] transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Try again
              </button>
              <Link
                href="/"
                className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-sand-100)] transition-colors"
              >
                Go home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
