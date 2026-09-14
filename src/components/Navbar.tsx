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
  type LucideIcon,
} from "lucide-react";
import { NotificationBell } from "./layout/NotificationBell";
import { AccountMenu } from "./layout/AccountMenu";
import { Logo } from "./Logo";
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
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border-default bg-bg-card"
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
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors duration-[var(--transition-fast)] ${
                isActive
                  ? "text-primary"
                  : "text-text-muted"
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

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full border-b border-border-subtle bg-bg-card/95 backdrop-blur-sm"
        role="banner"
      >
        <div className="container-app">
          <div className="flex h-16 items-center gap-8">
            <Logo />

            <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary navigation">
              {[
                { href: "/hostels", label: "Hostels" },
                { href: "/about", label: "About" },
                { href: "/contact", label: "Contact" },
              ].map(({ href, label }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`);

                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={`rounded-[var(--radius-md)] px-3 py-2 text-[var(--text-body-sm)] transition-colors duration-[var(--transition-fast)] ${
                      isActive
                        ? "bg-[var(--color-primary-faint)] font-[600] text-[var(--color-primary-deep)]"
                        : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-sidebar)] hover:text-[var(--color-text-heading)]"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex-1" />

            <div className="flex items-center gap-1">
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
