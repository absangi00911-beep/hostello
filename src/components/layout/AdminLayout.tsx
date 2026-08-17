// Path: src/components/layout/AdminLayout.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Star,
  RefreshCw,
  ShieldCheck,
  ChevronLeft,
  Wallet,
} from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { AccountMenu } from "./AccountMenu";
import { Logo } from "@/components/Logo";

const NAV_ITEMS = [
  { href: "/admin",              label: "Dashboard",    icon: LayoutDashboard },
  { href: "/admin/listings",     label: "Listings",     icon: Building2 },
  { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
  { href: "/admin/bookings",     label: "All bookings", icon: CalendarDays },
  { href: "/admin/payouts",      label: "Payouts",      icon: Wallet },
  { href: "/admin/reviews",      label: "Reviews",      icon: Star },
  { href: "/admin/search",       label: "Sync search",  icon: RefreshCw },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  pendingCount?: number;
  verificationCount?: number;
}

export function AdminLayout({ children, pendingCount, verificationCount }: AdminLayoutProps) {
  const pathname = usePathname();

  const currentNav = NAV_ITEMS.find((item) =>
    item.href === "/admin"
      ? pathname === item.href
      : pathname.startsWith(item.href)
  );
  const pageTitle = currentNav?.label ?? "Admin";

  return (
    <div className="flex min-h-dvh bg-[var(--color-bg-page)]">
      {/* -- Sidebar --------------------------------------------- */}
      <aside
        className="hidden md:flex flex-col w-[var(--sidebar-width)] shrink-0 sticky top-0 h-screen border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)]"
        aria-label="Admin sidebar"
      >
        {/* Logo + "Admin" badge */}
        <div className="flex h-16 items-center gap-3 px-5 border-b border-[var(--color-border-subtle)] shrink-0">
          <Logo size="compact" />
          <span className="ml-auto text-[var(--text-caption)] font-[600] text-overline text-[var(--color-text-muted)] bg-[var(--color-bg-overlay)] px-2 py-0.5 rounded-[var(--radius-sm)]">
            Admin
          </span>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <nav aria-label="Admin navigation">
            <ul className="space-y-0.5" role="list">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const isActive =
                  href === "/admin"
                    ? pathname === href
                    : pathname.startsWith(href);
                const showBadge = 
                  (href === "/admin/listings" && pendingCount && pendingCount > 0) ||
                  (href === "/admin/verifications" && verificationCount && verificationCount > 0);
                const badgeCount = href === "/admin/listings" ? pendingCount : verificationCount;

                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      className={`
                        flex items-center gap-3 h-10 px-3 rounded-[var(--radius-md)]
                        transition-colors duration-[var(--transition-fast)]
                        ${
                          isActive
                            // Full-row background tint — no side stripe needed
                            ? "bg-[var(--color-primary-light)] text-[var(--color-primary-deep)] font-[600]"
                            : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-text-body)]"
                        }
                      `}
                    >
                      <Icon
                        size={18}
                        strokeWidth={1.5}
                        aria-hidden="true"
                        className={isActive ? "text-[var(--color-primary)]" : ""}
                      />
                      <span className="text-[var(--text-body-sm)] flex-1">
                        {label}
                      </span>
                      {showBadge && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-warning)] px-1.5 text-[10px] font-[600] text-white">
                          {badgeCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

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

      {/* -- Main content ---------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/95 backdrop-blur-sm px-4 md:px-6 shrink-0">
          <h1 className="text-[var(--text-h5)] font-[600] text-[var(--color-text-heading)]">
            {pageTitle}
          </h1>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <AccountMenu />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
