// Path: src/components/landing/MarketingSections.tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Eye, Lock, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/landing/Reveal";

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
      <h2 className="mt-2 font-display text-[length:var(--text-h2)] font-[500] leading-tight tracking-[-0.025em] text-[color:var(--color-text-heading)]">
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
    <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
      {cities.map((city, index) => (
        <Reveal key={city} delay={Math.min(index * 0.025, 0.2)}>
          <Link
            href={`/hostels?city=${encodeURIComponent(city)}`}
            className="group flex items-center gap-3 border-b border-[var(--color-border-default)] py-3.5 transition-colors duration-[var(--transition-base)] hover:border-[var(--color-primary)]"
          >
            <span className="w-7 font-mono text-[10px] text-[color:var(--color-text-muted)]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="font-display text-[1.15rem] leading-tight tracking-[-0.015em] text-[color:var(--color-text-heading)] transition-colors group-hover:text-[color:var(--color-primary-deep)]">
              {city}
            </span>
            <ArrowRight size={14} strokeWidth={1.5} className="ml-auto -translate-x-1 text-[color:var(--color-primary)] opacity-0 transition-all duration-[var(--transition-base)] group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true" />
          </Link>
        </Reveal>
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
