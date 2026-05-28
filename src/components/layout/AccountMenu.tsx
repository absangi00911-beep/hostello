// Path: src/components/AccountMenu.tsx

"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  BookOpen,
  Heart,
  Settings,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  Building2,
  CalendarDays,
  MessageCircle,
  Star,
  BarChart2,
  ShieldCheck,
  RefreshCw,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";

type Role = "STUDENT" | "OWNER" | "ADMIN";

type MenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const MENU_ITEMS_BY_ROLE: Record<Role, MenuItem[]> = {
  STUDENT: [
    { href: "/dashboard/bookings", label: "My bookings", icon: BookOpen },
    { href: "/dashboard/saved", label: "Saved hostels", icon: Heart },
    { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
    { href: "/dashboard/price-alerts", label: "Price alerts", icon: TrendingDown },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/profile/settings", label: "Settings", icon: Settings },
  ],
  OWNER: [
    { href: "/owner/dashboard", label: "Owner dashboard", icon: LayoutDashboard },
    { href: "/owner/listings", label: "My listings", icon: Building2 },
    { href: "/owner/bookings", label: "Bookings", icon: CalendarDays },
    { href: "/owner/messages", label: "Messages", icon: MessageCircle },
    { href: "/owner/reviews", label: "Reviews", icon: Star },
    { href: "/owner/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/owner/settings", label: "Settings", icon: Settings },
  ],
  ADMIN: [
    { href: "/admin", label: "Admin panel", icon: LayoutDashboard },
    { href: "/admin/listings", label: "Listings", icon: Building2 },
    { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
    { href: "/admin/bookings", label: "All bookings", icon: CalendarDays },
    { href: "/admin/reviews", label: "Reviews", icon: Star },
    { href: "/admin/search", label: "Sync search", icon: RefreshCw },
    { href: "/profile/settings", label: "Settings", icon: Settings },
  ],
};

export function AccountMenu() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="hidden sm:inline-flex items-center h-9 px-4 rounded-[var(--radius-md)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-body)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] transition-all duration-[var(--transition-base)] hover:bg-[var(--color-bg-overlay)] hover:border-[var(--color-border-strong)]"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center h-9 px-4 rounded-[var(--radius-md)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-inverse)] bg-[var(--color-action)] transition-all duration-[var(--transition-base)] hover:bg-[var(--color-action-dark)]"
        >
          Register
        </Link>
      </div>
    );
  }

  const user = session.user;
  const menuItems = MENU_ITEMS_BY_ROLE[user.role as Role] ?? MENU_ITEMS_BY_ROLE.STUDENT;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 transition-colors duration-[var(--transition-fast)] hover:bg-[var(--color-bg-overlay)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
          aria-label="Account menu"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-deep)] text-[var(--text-body-sm)] font-[600] select-none overflow-hidden">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name ?? ""}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </span>
          <ChevronDown
            size={14}
            strokeWidth={1.5}
            className="text-[var(--color-text-muted)] hidden sm:block"
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-56 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-1 shadow-[var(--shadow-lg)]"
      >
        <div className="px-3 py-2 mb-1">
          <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-heading)] truncate">
            {user.name}
          </p>
          <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] truncate">
            {user.email}
          </p>
        </div>

        <DropdownMenuSeparator className="my-1 h-px bg-[var(--color-border-subtle)]" />

        {menuItems.map(({ href, label, icon: Icon }) => (
          <DropdownMenuItem key={href} asChild>
            <Link
              href={href}
              className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-[var(--text-body-sm)] text-[var(--color-text-body)] cursor-pointer hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-text-heading)]"
            >
              <Icon size={15} strokeWidth={1.5} aria-hidden="true" />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="my-1 h-px bg-[var(--color-border-subtle)]" />

        <DropdownMenuItem
          onSelect={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-[var(--text-body-sm)] text-[var(--color-error)] cursor-pointer hover:bg-[var(--color-error-bg)]"
        >
          <LogOut size={15} strokeWidth={1.5} aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
