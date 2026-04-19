"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function HostelDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <h1
          className="text-xl font-bold text-[var(--color-text)] mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Could not load this hostel
        </h1>
        <p className="text-sm text-[var(--color-muted)] mb-6">
          Something went wrong on our end. Try again or browse other listings.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary-900)] text-white text-sm font-semibold hover:bg-[var(--color-primary-800)] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href="/hostels"
            className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-sand-50)] transition-colors"
          >
            Browse hostels
          </Link>
        </div>
      </div>
    </div>
  );
}
