"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  MessageCircle,
  Star,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { AccountMenu } from "./AccountMenu";

const NAV_ITEMS = [
  { href: "/owner/dashboard",   label: "Overview",     icon: LayoutDashboard },
  { href: "/owner/listings",    label: "My listings",  icon: Building2 },
  { href: "/owner/bookings",    label: "Bookings",     icon: CalendarDays },
  { href: "/owner/messages",    label: "Messages",     icon: MessageCircle },
  { href: "/owner/reviews",     label: "Reviews",      icon: Star },
  { href: "/owner/settings",    label: "Settings",     icon: Settings },
];

function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Owner navigation">
      <ul className="space-y-0.5" role="list">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/owner/dashboard"
              ? pathname === href
              : pathname.startsWith(href);

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                title={collapsed ? label : undefined}
                className={`
                  group relative flex items-center gap-3 rounded-[var(--radius-md)] transition-colors duration-[var(--transition-fast)]
                  ${collapsed ? "h-10 w-10 justify-center" : "h-10 px-3"}
                  ${
                    isActive
                      ? "bg-[var(--color-primary-faint)] text-[var(--color-primary-deep)]"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-text-body)]"
                  }
                `}
              >
                {/* Active left-edge indicator */}
                {isActive && !collapsed && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--color-primary)]"
                  />
                )}
                <Icon
                  size={18}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className={isActive ? "text-[var(--color-primary)]" : ""}
                />
                {!collapsed && (
                  <span className="text-[var(--text-body-sm)] font-[500]">
                    {label}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

interface OwnerLayoutProps {
  children: React.ReactNode;
}

export function OwnerLayout({ children }: OwnerLayoutProps) {
  const pathname = usePathname();

  // Derive the page title from the current route
  const currentNav = NAV_ITEMS.find((item) =>
    item.href === "/owner/dashboard"
      ? pathname === item.href
      : pathname.startsWith(item.href)
  );
  const pageTitle = currentNav?.label ?? "Dashboard";

  return (
    <div className="flex min-h-dvh bg-[var(--color-bg-page)]">
      {/* ── Sidebar (desktop) ────────────────────────────────── */}
      <aside
        className="
          hidden md:flex flex-col
          w-[var(--sidebar-width)] shrink-0
          sticky top-0 h-screen
          border-r border-[var(--color-border-subtle)]
          bg-[var(--color-bg-sidebar)]
        "
        aria-label="Owner dashboard sidebar"
      >
        {/* Logo */}
        <div className="flex h-16 items-center px-5 border-b border-[var(--color-border-subtle)] shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2 rounded-[var(--radius-sm)]"
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
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <SidebarNav collapsed={false} />
        </div>

        {/* Bottom — back to site link */}
        <div className="px-3 py-4 border-t border-[var(--color-border-subtle)] shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-[var(--text-body-sm)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-text-body)] transition-colors duration-[var(--transition-fast)]"
          >
            <ChevronLeft size={15} strokeWidth={1.5} aria-hidden="true" />
            Back to site
          </Link>
        </div>
      </aside>

      {/* ── Main content area ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/95 backdrop-blur-sm px-4 md:px-6 shrink-0">
          <h1
            className="text-[var(--text-h5)] font-[600] text-[var(--color-text-heading)]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {pageTitle}
          </h1>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <AccountMenu />
          </div>
        </header>

        {/* Page content */}
        <main
          className="flex-1 p-4 md:p-6 pb-20 md:pb-6"
          id="main-content"
        >
          {children}
        </main>
      </div>

      {/* ── Mobile bottom tab bar ─────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-[var(--color-border-default)] bg-[var(--color-bg-card)]"
        aria-label="Mobile owner navigation"
      >
        <div className="flex">
          {NAV_ITEMS.slice(0, 4).map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/owner/dashboard"
                ? pathname === href
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
                <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}