"use client";

// Path: src/components/Navbar.tsx

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
  MapPin,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { NotificationBell } from "./layout/NotificationBell";
import { AccountMenu } from "./layout/AccountMenu";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { CitySelector } from "./layout/CitySelector";
import { Suspense } from "react";

type Role = "STUDENT" | "OWNER" | "ADMIN";

type MobileTab = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const PUBLIC_TABS: MobileTab[] = [
  { href: "/hostels", label: "Search", icon: Search },
  { href: "/login", label: "Account", icon: User },
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

function MobileTabBar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const role = status === "authenticated" ? (session?.user.role as Role) : null;
  const tabs = tabsForRole(role);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-[0_-8px_24px_rgba(0,0,0,0.04)] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile navigation"
    >
      <div className="flex gap-1 px-2 py-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = isActiveTab(pathname, href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] px-2 py-2.5 text-[10px] font-[600] transition-all duration-[var(--transition-fast)] ${
                isActive
                  ? "bg-[var(--color-primary-faint)] text-[color:var(--color-primary-deep)] shadow-[inset_0_0_0_1px_var(--color-primary-light)]"
                  : "text-[color:var(--color-text-muted)] hover:bg-[var(--color-bg-sidebar)]"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]"
        role="banner"
      >
        <div className="container-app flex h-20 items-center gap-3 md:gap-4">
          <Logo />

          {/* Search cluster: city selector + search trigger, the nav's
              compact/collapsed form of search on every page. The full
              interactive hero search (Day 6) is homepage-only and will
              collapse into this same pill on scroll. */}
          <div className="flex flex-1 items-center justify-center">
            <div className="hidden items-center gap-2 md:flex">
              <Suspense
                fallback={
                  <div
                    aria-hidden="true"
                    className="flex h-10 w-32 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-3 text-[length:var(--text-body-sm)] font-[500] text-[color:var(--color-text-muted)]"
                  >
                    <MapPin size={14} strokeWidth={1.5} className="shrink-0 text-[color:var(--color-primary)]" />
                    <span className="max-w-[100px] truncate">All cities</span>
                    <ChevronDown size={12} strokeWidth={1.5} className="shrink-0" />
                  </div>
                }
              >
                <CitySelector />
              </Suspense>
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

          {session && (
            <Suspense fallback={null}>
              <NotificationBell />
            </Suspense>
          )}

          <AccountMenu />
        </div>
      </header>

      <MobileTabBar />
    </>
  );
}
