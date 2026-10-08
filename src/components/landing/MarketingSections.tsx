// Path: src/components/landing/MarketingSections.tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Eye, Lock, MapPin, ShieldCheck } from "lucide-react";

export function SectionFrame({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`w-full ${className}`}>
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  heading,
  sub,
}: {
  eyebrow: string;
  heading: string;
  sub: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-[length:var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-[color:var(--color-primary-deep)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-heading text-[length:var(--text-h2)] font-[600] text-[color:var(--color-text-heading)]">
        {heading}
      </h2>
      <p className="mt-3 text-[length:var(--text-body)] text-[color:var(--color-text-muted)]">{sub}</p>
    </div>
  );
}

export function TrustProof({
  dark = false,
  className = "",
}: {
  dark?: boolean;
  className?: string;
}) {
  const items = [
    {
      icon: ShieldCheck,
      label: "Verified hostel listings",
      description: "Reviewed before students book.",
    },
    {
      icon: Eye,
      label: "Real prices before you call",
      description: "Monthly rent is visible upfront.",
    },
    {
      icon: Lock,
      label: "Secure booking handoff",
      description: "Your booking stays tracked end to end.",
    },
  ];

  return (
    <div
      className={`grid gap-2 pt-4 sm:grid-cols-3 ${className} ${dark ? "border-t border-white/15" : "border-t border-[var(--color-border-subtle)]"}`}
      aria-label="HostelLo trust proof"
    >
      {items.map(({ icon: Icon, label, description }) => (
        <div key={label} className="flex gap-2.5 sm:block">
          <Icon
            size={17}
            strokeWidth={1.6}
            className={`mt-0.5 shrink-0 ${dark ? "text-white/80" : "text-[color:var(--color-primary-deep)]"}`}
            aria-hidden="true"
          />
          <div>
            <p className={`text-[length:var(--text-body-sm)] font-[700] ${dark ? "text-white" : "text-[color:var(--color-text-heading)]"}`}>
              {label}
            </p>
            <p className={`mt-0.5 text-[length:var(--text-caption)] leading-relaxed ${dark ? "text-white/70" : "text-[color:var(--color-text-muted)]"}`}>
              {description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CityGrid({ cities }: { cities: string[] }) {
  return (
    <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
      {cities.map((city) => (
        <Link
          key={city}
          href={`/hostels?city=${encodeURIComponent(city)}`}
          className="group flex flex-col items-center gap-2 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] px-4 py-5 text-center shadow-[0_8px_20px_rgba(0,0,0,0.03)] transition-all duration-[var(--transition-fast)] hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-[0_12px_30px_rgba(232,67,92,0.10)]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-faint)]">
            <MapPin
              size={18}
              strokeWidth={1.5}
              className="text-[color:var(--color-primary-deep)]"
              aria-hidden="true"
            />
          </div>
          <span className="text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-heading)] group-hover:text-[color:var(--color-primary)]">
            {city}
          </span>
        </Link>
      ))}
    </div>
  );
}

export function SectionCtaLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-link)] hover:underline"
    >
      {children}
      <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
    </Link>
  );
}