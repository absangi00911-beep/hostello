"use client";

// Path: src/components/Navbar.tsx

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, Heart, MessageCircle, User } from "lucide-react";
import { NotificationBell } from "./layout/NotificationBell";
import { AccountMenu } from "./layout/AccountMenu";
import { CitySelector } from "./layout/CitySelector";
import { Suspense, useState } from "react";

/* ── HostelLo wordmark ───────────────────────────────────── */
function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 shrink-0 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2 rounded-[var(--radius-sm)]"
      aria-label="HostelLo home"
    >
      {/* Simple geometric mark — two overlapping squares suggesting a building */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
      >
        <rect x="2" y="8" width="16" height="18" rx="2" fill="currentColor" className="text-[var(--color-primary)]" />
        <rect x="10" y="2" width="16" height="18" rx="2" fill="currentColor" className="text-[var(--color-primary-deep)]" opacity="0.7" />
        <rect x="6" y="16" width="4" height="6" rx="1" fill="var(--color-bg-card)" />
      </svg>
      <span
        className="text-[1.125rem] font-[700] tracking-[-0.02em] text-[var(--color-text-heading)]"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        HostelLo
      </span>
    </Link>
  );
}

/* ── Compact search bar ──────────────────────────────────── */
function NavSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/hostels?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="hidden md:flex items-center gap-0 flex-1 max-w-sm mx-4"
      role="search"
    >
      <div className="relative flex-1">
        <Search
          size={15}
          strokeWidth={1.5}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search hostels..."
          aria-label="Search hostels"
          className="w-full h-9 pl-9 pr-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] text-[var(--text-body-sm)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-placeholder)] transition-all duration-[var(--transition-base)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[oklch(0.62_0.17_65_/_0.15)]"
        />
      </div>
    </form>
  );
}

/* ── Mobile bottom tab bar ───────────────────────────────── */
function MobileTabBar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const tabs = [
    { href: "/hostels", label: "Search", icon: Search },
    { href: "/dashboard/saved", label: "Saved", icon: Heart },
    { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
    { href: session ? "/profile" : "/login", label: "Account", icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-[var(--color-border-default)] bg-[var(--color-bg-card)]"
      aria-label="Mobile navigation"
    >
      <div className="flex">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/hostels"
              ? pathname.startsWith("/hostels")
              : href === "/profile" || href === "/login"
              ? pathname.startsWith("/profile") || pathname === "/login"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-[500] transition-colors duration-[var(--transition-fast)] ${
                isActive
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)]"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={20}
                strokeWidth={1.5}
                aria-hidden="true"
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* ── Main Navbar ─────────────────────────────────────────── */
export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Add shadow after 40px scroll — handled via CSS + scroll event would be
  // cleaner but this static class works for the SSR render
  const isHome = pathname === "/";

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/95 backdrop-blur-sm"
        role="banner"
      >
        <div className="container-app">
          <div className="flex h-16 items-center gap-3">
            {/* Logo */}
            <Logo />

            {/* City selector — shown on non-home pages (home has its own hero search) */}
            {!isHome && (
              <Suspense fallback={null}>
                <CitySelector />
              </Suspense>
            )}

            {/* Search bar (desktop, hidden on home — hero handles it) */}
            {!isHome && <NavSearch />}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right side actions */}
            <div className="flex items-center gap-1">
              {/* Mobile search icon — links to search page */}
              <Link
                href="/hostels"
                className="flex md:hidden h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-text-body)] transition-colors duration-[var(--transition-fast)]"
                aria-label="Search hostels"
              >
                <Search size={18} strokeWidth={1.5} aria-hidden="true" />
              </Link>

              {/* Notification bell — only for signed-in users */}
              {session && (
                <Suspense fallback={null}>
                  <NotificationBell />
                </Suspense>
              )}

              {/* Account menu / auth buttons */}
              <AccountMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <MobileTabBar />
    </>
  );
}