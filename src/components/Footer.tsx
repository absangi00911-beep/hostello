// Path: src/components/Footer.tsx

import Link from "next/link";

const NAV_LINKS = [
  { label: "Find hostels", href: "/hostels" },
  { label: "List your hostel", href: "/register?role=OWNER" },
  { label: "How it works", href: "/#how-it-works" },
];

const LEGAL_LINKS = [
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of service", href: "/terms" },
  { label: "Contact", href: "/contact" },
  { label: "Report an issue", href: "/report" },
];

export function Footer() {
  return (
    <footer
      className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)]"
      aria-label="Site footer"
    >
      <div className="container-app py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Col 1 — Brand */}
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2 rounded-[var(--radius-sm)]"
              aria-label="HostelLo home"
            >
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                <rect x="2" y="8" width="16" height="18" rx="2" fill="var(--color-primary)" />
                <rect x="10" y="2" width="16" height="18" rx="2" fill="var(--color-primary-deep)" opacity="0.7" />
                <rect x="6" y="16" width="4" height="6" rx="1" fill="var(--color-bg-sidebar)" />
              </svg>
              <span
                className="text-[1rem] font-[700] tracking-[-0.02em] text-[var(--color-text-heading)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                HostelLo
              </span>
            </Link>
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
              {NAV_LINKS.map(({ label, href }) => (
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
