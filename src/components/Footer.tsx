// Path: src/components/Footer.tsx
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Logo } from "./Logo";

const NAV_LINKS = [
  { label: "Find hostels", href: "/hostels" },
  { label: "List your hostel", href: "/list-your-hostel" },
  { label: "How it works", href: "/#how-it-works" },
];

const LEGAL_LINKS = [
  { label: "Help centre", href: "/help" },
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of service", href: "/terms" },
  { label: "Contact", href: "/contact" },
  { label: "Report an issue", href: "/report" },
];

export function Footer() {
  const { data: session, status } = useSession();
  const hideOwnerLinks =
    status === "loading" ||
    session?.user.role === "STUDENT" ||
    session?.user.role === "ADMIN";
  const ownerListingHref =
    session?.user.role === "OWNER" ? "/owner/listings/new" : "/list-your-hostel";
  const navLinks =
    hideOwnerLinks
      ? NAV_LINKS.filter((link) => link.href !== "/list-your-hostel")
      : NAV_LINKS.map((link) =>
          link.href === "/list-your-hostel"
            ? { ...link, href: ownerListingHref }
            : link,
        );

  return (
    <footer
      className="hidden border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] md:block"
      aria-label="Site footer"
    >
      <div className="container-app py-14 md:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1fr] md:gap-16">
          {/* Col 1 — Brand */}
          <div className="space-y-5">
            <Logo className="[&>span]:text-[color:var(--color-text-heading)]" />
            <p className="max-w-[280px] font-display text-[length:var(--text-h3)] leading-tight tracking-[-0.02em] text-[color:var(--color-text-heading)]">
              Find your room.<br />
              Not a phone number.
            </p>
            <p className="text-[length:var(--text-body-sm)] leading-relaxed text-[color:var(--color-text-muted)]">
              Verified student hostels, clear monthly prices, and a simpler way to move closer to campus.
            </p>
            <p className="text-[length:var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-[color:var(--color-primary-deep)]">
              Pakistan only · Prices in PKR
            </p>
          </div>

          {/* Col 2 — Navigation */}
          <div className="space-y-3">
            <p className="text-[length:var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
              Explore
            </p>
            <ul className="space-y-3" role="list">
              {navLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)] transition-colors duration-[var(--transition-fast)] hover:text-[color:var(--color-primary)]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Legal & Contact */}
          <div className="space-y-3">
            <p className="text-[length:var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
              Help & legal
            </p>
            <ul className="space-y-3" role="list">
              {LEGAL_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)] transition-colors duration-[var(--transition-fast)] hover:text-[color:var(--color-primary)]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-[var(--color-border-default)] pt-6 sm:flex-row">
          <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
            © {new Date().getFullYear()} HostelLo. All rights reserved.
          </p>
          <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
            Built for Pakistani students, by Pakistanis.
          </p>
        </div>
      </div>
    </footer>
  );
}
