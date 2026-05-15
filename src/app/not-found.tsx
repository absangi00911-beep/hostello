// Path: src/app/not-found.tsx
import Link from "next/link";
import { Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-[var(--color-bg-page)] flex flex-col items-center justify-center px-4 text-center">
      {/* Large 404 — Bricolage Grotesque 120px/800
          Color: --color-primary-faint (muted, not alarming per spec) */}
      <p
        className="select-none leading-none mb-6"
        style={{
          fontFamily:    "var(--font-heading)",
          fontSize:      "clamp(80px, 18vw, 120px)",
          fontWeight:    800,
          color:         "var(--color-primary-faint)",
          letterSpacing: "-0.04em",
        }}
        aria-hidden="true"
      >
        404
      </p>

      {/* Heading */}
      <h1
        className="text-[var(--text-h3)] font-[600] text-[var(--color-text-heading)] mb-3"
        style={{ fontFamily: "var(--font-body)" }}
      >
        This page doesn&apos;t exist
      </h1>

      {/* Description */}
      <p className="text-[var(--text-body)] text-[var(--color-text-muted)] max-w-[42ch] mb-8 leading-relaxed">
        The hostel or page you&apos;re looking for may have moved or been removed.
      </p>

      {/* Two CTAs */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/hostels"
          className="inline-flex items-center gap-2 h-11 px-6 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-inverse)] transition-all duration-[var(--transition-base)] hover:bg-[var(--color-action-dark)] active:bg-[var(--color-action-pressed)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-[var(--color-action-light)] focus-visible:outline-offset-2"
        >
          <Search size={16} strokeWidth={1.5} aria-hidden="true" />
          Search hostels
        </Link>

        <Link
          href="/"
          className="inline-flex items-center h-11 px-6 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-body)] transition-all duration-[var(--transition-base)] hover:bg-[var(--color-bg-overlay)] hover:border-[var(--color-border-strong)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}