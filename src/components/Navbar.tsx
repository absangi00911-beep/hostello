"use client";

// Path: src/components/Navbar.tsx

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  type LucideIcon,
} from "lucide-react";
import { NotificationBell } from "./layout/NotificationBell";
import { AccountMenu } from "./layout/AccountMenu";
import { CitySelector } from "./layout/CitySelector";
import { Logo } from "./Logo";
import { Suspense, useState } from "react";

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
          className="w-full h-9 pl-9 pr-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] text-[var(--text-body-sm)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-placeholder)] transition-all duration-[var(--transition-base)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/15"
        />
      </div>
    </form>
  );
}

function MobileTabBar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const role = status === "authenticated" ? (session?.user.role as Role) : null;
  const tabs = tabsForRole(role);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-[var(--color-border-default)] bg-[var(--color-bg-card)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile navigation"
    >
      <div className="flex">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = isActiveTab(pathname, href);

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
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isHome = pathname === "/";

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/95 backdrop-blur-sm"
        role="banner"
      >
        <div className="container-app">
          <div className="flex h-16 items-center gap-3">
            <Logo aria-label="HostelLo home" className="shrink-0" />

            {!isHome && (
              <Suspense fallback={null}>
                <CitySelector />
              </Suspense>
            )}

            {!isHome && <NavSearch />}

            <div className="flex-1" />

            <div className="flex items-center gap-1">
              <Link
                href="/hostels"
                className="flex md:hidden h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-text-body)] transition-colors duration-[var(--transition-fast)]"
                aria-label="Search hostels"
              >
                <Search size={18} strokeWidth={1.5} aria-hidden="true" />
              </Link>

              {session && (
                <Suspense fallback={null}>
                  <NotificationBell />
                </Suspense>
              )}

              <AccountMenu />
            </div>
          </div>
        </div>
      </header>

      <MobileTabBar />
    </>
  );
}
