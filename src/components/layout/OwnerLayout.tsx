// Path: src/components/layout/OwnerLayout.tsx

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
  CreditCard,
  Wallet,
} from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { AccountMenu } from "./AccountMenu";
import { Logo } from "@/components/Logo";

const NAV_ITEMS = [
  { href: "/owner/dashboard",    label: "Overview",    icon: LayoutDashboard },
  { href: "/owner/listings",     label: "My listings", icon: Building2 },
  { href: "/owner/bookings",     label: "Bookings",    icon: CalendarDays },
  { href: "/owner/messages",     label: "Messages",    icon: MessageCircle },
  { href: "/owner/reviews",      label: "Reviews",     icon: Star },
  { href: "/owner/subscription", label: "Plan",        icon: CreditCard },
  { href: "/owner/earnings",     label: "Earnings",    icon: Wallet },
  { href: "/owner/settings",     label: "Settings",    icon: Settings },
];

function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="owner-sidebar-nav" aria-label="Owner navigation">
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
                className={`owner-sidebar-link
                  flex items-center gap-3 h-10 px-3 rounded-[var(--radius-md)]
                  transition-colors duration-[var(--transition-fast)]
                  ${
                    isActive
                      ? "bg-[var(--color-bg-raised)] text-[color:var(--color-text-heading)] font-[600]"
                      : "text-[color:var(--color-text-muted)] hover:bg-[var(--color-bg-overlay)] hover:text-[color:var(--color-text-body)]"
                  }
                `}
              >
                <Icon
                  size={18}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className={isActive ? "text-[color:var(--color-primary)]" : ""}
                />
                <span className="text-[length:var(--text-body-sm)] flex-1">
                  {label}
                </span>
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

  const currentNav = NAV_ITEMS.find((item) =>
    item.href === "/owner/dashboard"
      ? pathname === item.href
      : pathname.startsWith(item.href)
  );
  const pageTitle =
    pathname === "/owner/listings/new"
      ? "Add listing"
      : pathname.endsWith("/edit")
        ? "Edit listing"
        : pathname === "/owner/listings/success"
          ? "Listing submitted"
          : currentNav?.label ?? "Dashboard";
  const pageDescription = pathname.startsWith("/owner/listings")
    ? "Keep your property details, photos, and availability current."
    : pageTitle === "Overview"
      ? "A clear view of your listings, bookings, and next steps."
      : pageTitle === "Bookings"
        ? "Respond to requests and keep every upcoming stay on track."
        : pageTitle === "Messages"
          ? "Reply to student questions and keep booking details in one place."
          : pageTitle === "Reviews"
            ? "Read feedback from past guests and respond to their stay."
            : pageTitle === "Plan"
              ? "View your current plan and subscription status."
              : pageTitle === "Earnings"
                ? "Track eligible balances, payout history, and bank details."
                : pageTitle === "Settings"
                  ? "Keep your profile and account secure."
                  : "Manage your HostelLo workspace.";

  return (
    <div className="owner-shell flex min-h-dvh bg-[var(--color-bg-page)]">
      {/* -- Sidebar (desktop) ---------------------------------- */}
      <aside
        className="owner-sidebar hidden md:flex flex-col w-[var(--sidebar-width)] shrink-0 sticky top-0 h-screen border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)]"
        aria-label="Owner dashboard sidebar"
      >
        {/* Logo */}
        <div className="flex h-16 items-center px-5 border-b border-[var(--color-border-subtle)] shrink-0">
          <Logo size="compact" />
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <SidebarNav />
        </div>

        <div className="px-3 py-4 border-t border-[var(--color-border-subtle)] shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)] hover:bg-[var(--color-bg-overlay)] hover:text-[color:var(--color-text-body)] transition-colors duration-[var(--transition-fast)]"
          >
            <ChevronLeft size={15} strokeWidth={1.5} aria-hidden="true" />
            Back to site
          </Link>
        </div>
      </aside>

      {/* -- Main content area ----------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="owner-topbar sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/95 backdrop-blur-sm px-4 md:gap-4 md:px-6 shrink-0">
          <h1 className="min-w-0 flex-1 truncate text-[length:var(--text-h5)] font-[600] text-[color:var(--color-text-heading)]">
            {pageTitle}
          </h1>
          <div className="flex shrink-0 items-center gap-1">
            <NotificationBell />
            <AccountMenu />
          </div>
        </header>

        <main className="owner-main flex-1 p-4 md:p-6 pb-20 md:pb-6" id="main-content">
          <header className="owner-page-masthead">
            <div className="owner-page-overline"><span>HOSTELLO · OWNER FIELD DESK</span><span>WORKSPACE / 0{Math.max(1, NAV_ITEMS.findIndex((item) => item.href === currentNav?.href) + 1)}</span></div>
            <h2>{pageTitle}</h2>
            <p>{pageDescription}</p>
          </header>
          {children}
        </main>
      </div>

      {/* -- Mobile bottom tab bar (first 4 nav items) ----------- */}
      <nav
        className="owner-mobile-nav fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-[var(--color-border-default)] bg-[var(--color-bg-card)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
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
                className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[length:var(--text-caption)] font-[500] transition-colors duration-[var(--transition-fast)] ${
                  isActive
                    ? "text-[color:var(--color-primary)]"
                    : "text-[color:var(--color-text-muted)]"
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
