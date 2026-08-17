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
      className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)]"
      aria-label="Site footer"
    >
      <div className="container-app py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Col 1 — Brand */}
          <div className="space-y-3">
            <Logo />
            <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] max-w-[220px] leading-relaxed">
              Find your room. Not a phone number.
            </p>
            <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
              Pakistan only · Prices in PKR
            </p>
          </div>

          {/* Col 2 — Navigation */}
          <div className="space-y-3">
            <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">
              Platform
            </p>
            <ul className="space-y-2.5" role="list">
              {navLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-body)] transition-colors duration-[var(--transition-fast)]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Legal & Contact */}
          <div className="space-y-3">
            <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">
              Company
            </p>
            <ul className="space-y-2.5" role="list">
              {LEGAL_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-body)] transition-colors duration-[var(--transition-fast)]"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-[var(--color-border-subtle)] flex flex-col sm:flex-row justify-between gap-3">
          <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} HostelLo. All rights reserved.
          </p>
          <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
            Built for Pakistani students, by Pakistanis.
          </p>
        </div>
      </div>
    </footer>
  );
}
