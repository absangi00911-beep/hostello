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
      className="relative hidden overflow-hidden border-t border-white/10 bg-[var(--color-text-heading)] md:block"
      aria-label="Site footer"
    >
      <div className="container-app py-14 md:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1fr] md:gap-16">
          {/* Col 1 — Brand */}
          <div className="space-y-5">
            <Logo className="[&>span]:text-white" />
            <p className="max-w-[280px] font-heading text-[1.35rem] leading-tight text-white">
              Find your room.<br />
              Not a phone number.
            </p>
            <p className="text-[var(--text-body-sm)] leading-relaxed text-white/60">
              Verified student hostels, clear monthly prices, and a simpler way to move closer to campus.
            </p>
            <p className="text-[var(--text-caption)] font-[600] uppercase tracking-[0.08em] text-[var(--color-primary-light)]">
              Pakistan only · Prices in PKR
            </p>
          </div>

          {/* Col 2 — Navigation */}
          <div className="space-y-3">
            <p className="text-[var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-white/50">
              Explore
            </p>
            <ul className="space-y-3" role="list">
              {navLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[var(--text-body-sm)] text-white/75 transition-colors duration-[var(--transition-fast)] hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Legal & Contact */}
          <div className="space-y-3">
            <p className="text-[var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-white/50">
              Help & legal
            </p>
            <ul className="space-y-3" role="list">
              {LEGAL_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-[var(--text-body-sm)] text-white/75 transition-colors duration-[var(--transition-fast)] hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-[var(--text-caption)] text-white/50">
            © {new Date().getFullYear()} HostelLo. All rights reserved.
          </p>
          <p className="text-[var(--text-caption)] text-white/50">
            Built for Pakistani students, by Pakistanis.
          </p>
        </div>
      </div>
    </footer>
  );
}
