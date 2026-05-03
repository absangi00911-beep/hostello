"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, X, Home, Search, PlusSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/hostels",  label: "Browse hostels" },
  { href: "/hostels/compare",  label: "Compare"         },
  { href: "/about",    label: "About"            },
];

export function Navbar() {
  const pathname              = usePathname();
  const { data: session }     = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const isOwner = session?.user?.role === "OWNER";

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-16 bg-[var(--color-surface)]/90 backdrop-blur-sm border-b border-[var(--color-border)]">
      <nav className="mx-auto max-w-7xl h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 flex-shrink-0"
          aria-label="HostelLo home"
        >
          <span
            className="text-xl font-extrabold text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Hostel
            <span className="text-[var(--color-brand-500)]">Lo</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "text-[var(--color-ink)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop actions — two paths max, clear hierarchy */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              {/* Authenticated: dashboard shortcut + profile */}
              {isOwner ? (
                <Link
                  href="/dashboard/hostels/new"
                  className="text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                  + Add listing
                </Link>
              ) : (
                <Link
                  href="/auth/signup?role=owner"
                  className="text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
                >
                  List your hostel
                </Link>
              )}
              <Link
                href="/dashboard"
                className="flex items-center gap-2 h-11 px-4 rounded-xl bg-[var(--color-ground)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-border)] transition-colors btn-press"
              >
                <User className="w-3.5 h-3.5" />
                {session.user?.name?.split(" ")[0] ?? "Account"}
              </Link>
            </>
          ) : (
            <>
              {/*
                Unauthenticated: two CTAs, one job each.
                "List your hostel" = owner acquisition (secondary)
                "Sign in"          = returning user authentication (tertiary)
                No "Get started" — search bar in hero handles new student acquisition.
              */}
              <Link
                href="/auth/signup?role=owner"
                className="h-11 px-4 flex items-center rounded-xl text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-ground)] transition-colors"
              >
                List your hostel
              </Link>
              <Link
                href="/auth/signin"
                className="h-11 px-4 rounded-xl bg-[var(--color-ink)] text-[var(--color-ground)] text-sm font-semibold hover:opacity-90 transition-opacity flex items-center btn-press"
              >
                Sign in
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-ground)] transition-colors"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 space-y-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "block py-2.5 px-3 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "bg-[var(--color-ground)] text-[var(--color-ink)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-ground)] hover:text-[var(--color-ink)]"
              )}
            >
              {label}
            </Link>
          ))}

          <div className="pt-2 border-t border-[var(--color-border)] space-y-1">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2.5 px-3 rounded-lg text-sm font-medium text-[var(--color-muted)] hover:bg-[var(--color-ground)] hover:text-[var(--color-ink)] transition-colors"
                >
                  My account
                </Link>
                <Link
                  href={isOwner ? "/dashboard/hostels/new" : "/auth/signup?role=owner"}
                  onClick={() => setMenuOpen(false)}
                  className="block py-2.5 px-3 rounded-lg text-sm font-semibold text-[var(--color-brand-700)] hover:bg-[var(--color-ground)] transition-colors"
                >
                  {isOwner ? "+ Add listing" : "List your hostel"}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2.5 px-3 rounded-lg text-sm font-medium text-[var(--color-muted)] hover:bg-[var(--color-ground)] hover:text-[var(--color-ink)] transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup?role=owner"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2.5 px-3 rounded-lg text-sm font-semibold text-[var(--color-brand-700)] hover:bg-[var(--color-ground)] transition-colors"
                >
                  List your hostel
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}