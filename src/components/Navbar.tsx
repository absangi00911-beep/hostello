"use client";

// Path: src/components/Navbar.tsx

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Search,
  Heart,
  MessageCircle,
  User,
  LayoutDashboard,
  Building2,
  CalendarDays,
  ShieldCheck,
  RefreshCw,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { NotificationBell } from "./layout/NotificationBell";
import { AccountMenu } from "./layout/AccountMenu";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

type Role = "STUDENT" | "OWNER" | "ADMIN";

type MobileTab = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const PUBLIC_TABS: MobileTab[] = [
  { href: "/hostels", label: "Search", icon: Search },
  { href: "/login", label: "Sign in", icon: User },
];

const STUDENT_TABS: MobileTab[] = [
  { href: "/hostels", label: "Search", icon: Search },
  { href: "/dashboard/saved", label: "Saved", icon: Heart },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "Account", icon: User },
];

const OWNER_TABS: MobileTab[] = [
  { href: "/owner/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/owner/listings", label: "Listings", icon: Building2 },
  { href: "/owner/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/owner/messages", label: "Messages", icon: MessageCircle },
];

const ADMIN_TABS: MobileTab[] = [
  { href: "/admin", label: "Admin", icon: LayoutDashboard },
  { href: "/admin/listings", label: "Listings", icon: Building2 },
  { href: "/admin/verifications", label: "Verify", icon: ShieldCheck },
  { href: "/admin/search", label: "Sync", icon: RefreshCw },
];

function tabsForRole(role?: Role | null): MobileTab[] {
  if (role === "OWNER") return OWNER_TABS;
  if (role === "ADMIN") return ADMIN_TABS;
  if (role === "STUDENT") return STUDENT_TABS;
  return PUBLIC_TABS;
}

function isActiveTab(pathname: string, href: string) {
  if (href === "/hostels") return pathname.startsWith("/hostels");
  if (href === "/profile" || href === "/login") {
    return pathname.startsWith("/profile") || pathname === "/login";
  }
  if (href === "/admin") return pathname === "/admin";
  if (href === "/owner/dashboard") return pathname === href;
  return pathname.startsWith(href);
}

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const role = session?.user.role as Role | undefined;
  const mobileTabs = tabsForRole(role);

  const navItems = [
    { href: "/about", label: "About" },
    { href: "/help", label: "Help" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] shadow-[0_1px_0_rgb(49_39_28_/_0.02)]"
        role="banner"
      >
        <div className="container-app flex h-[72px] items-center gap-3 md:gap-4">
          <Logo />

          <div className="flex flex-1 items-center justify-center">
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/hostels"
                className="flex items-center gap-2 rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] py-2 pl-2 pr-4 text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)] transition-shadow duration-[var(--transition-fast)] hover:shadow-[var(--shadow-sm)] hover:text-[color:var(--color-text-heading)]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)] text-[color:var(--color-text-inverse)]">
                  <Search size={13} strokeWidth={2.5} aria-hidden="true" />
                </span>
                Start your search
              </Link>
            </div>
          </div>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {navItems.map(({ href, label }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`);

              return (
                <Button
                  key={href}
                  asChild
                  variant="ghost"
                  size="sm"
                  className={isActive ? "text-[color:var(--color-text-heading)]" : "text-[color:var(--color-text-muted)]"}
                >
                  <Link href={href} aria-current={isActive ? "page" : undefined}>
                    {label}
                  </Link>
                </Button>
              );
            })}
          </nav>

          <div className="hidden md:flex">
            <Button asChild variant="ghost" shape="pill" size="sm">
              <Link href="/list-your-hostel">List your hostel</Link>
            </Button>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] text-[color:var(--color-text-body)] hover:bg-[var(--color-bg-overlay)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] md:hidden"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation-menu"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            {isMobileMenuOpen ? (
              <X size={20} strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Menu size={20} strokeWidth={1.75} aria-hidden="true" />
            )}
          </button>

          {session && (
            <Suspense fallback={null}>
              <NotificationBell />
            </Suspense>
          )}

          <AccountMenu />
        </div>

        <nav
          id="mobile-navigation-menu"
          className={`${isMobileMenuOpen ? "block" : "hidden"} absolute inset-x-0 top-full z-50 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] shadow-[var(--shadow-lg)] md:hidden`}
          aria-label="Mobile navigation"
        >
          <div className="container-app space-y-4 py-4">
            <section aria-labelledby="mobile-primary-navigation-heading">
              <h2
                id="mobile-primary-navigation-heading"
                className="mb-2 px-1 text-[length:var(--text-body-xs)] font-[600] uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]"
              >
                Quick links
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {mobileTabs.map(({ href, label, icon: Icon }) => {
                  const isActive = isActiveTab(pathname, href);

                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`group flex min-h-14 items-center gap-3 rounded-[var(--radius-lg)] border p-3 text-[length:var(--text-body-sm)] font-[600] transition-colors ${
                        isActive
                          ? "border-[var(--color-primary-light)] bg-[var(--color-primary-faint)] text-[color:var(--color-primary-deep)]"
                          : "border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[color:var(--color-text-body)] hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-sidebar)]"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${
                          isActive
                            ? "bg-[var(--color-bg-card)] text-[color:var(--color-primary)]"
                            : "bg-[var(--color-bg-sidebar)] text-[color:var(--color-text-muted)] group-hover:text-[color:var(--color-primary)]"
                        }`}
                      >
                        <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 truncate">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
            <section
              aria-labelledby="mobile-more-navigation-heading"
              className="border-t border-[var(--color-border-subtle)] pt-3"
            >
              <h2
                id="mobile-more-navigation-heading"
                className="mb-2 px-1 text-[length:var(--text-body-xs)] font-[600] uppercase tracking-[0.12em] text-[color:var(--color-text-muted)]"
              >
                More
              </h2>
              <div className="grid grid-cols-3 gap-1">
                {navItems.map(({ href, label }) => {
                  const isActive = pathname === href || pathname.startsWith(`${href}/`);

                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`rounded-[var(--radius-md)] px-3 py-2.5 text-center text-[length:var(--text-body-sm)] font-[500] transition-colors ${
                        isActive
                          ? "bg-[var(--color-primary-faint)] text-[color:var(--color-primary-deep)]"
                          : "text-[color:var(--color-text-muted)] hover:bg-[var(--color-bg-sidebar)] hover:text-[color:var(--color-text-heading)]"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
              <Link
                href="/list-your-hostel"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-primary)] px-4 text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-inverse)] transition-colors hover:bg-[var(--color-primary-dark)]"
              >
                <Building2 size={17} strokeWidth={1.75} aria-hidden="true" />
                List your hostel
              </Link>
            </section>
          </div>
        </nav>
      </header>
    </>
  );
}
