// Path: src/components/AccountMenu.tsx

"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  Wallet,
  CreditCard,
  ShieldCheck,
  RefreshCw,
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
    { href: "/profile", label: "Profile", icon: User },
    { href: "/profile/settings", label: "Settings", icon: Settings },
  ],
  OWNER: [
    { href: "/owner/dashboard", label: "Owner dashboard", icon: LayoutDashboard },
    { href: "/owner/listings", label: "My listings", icon: Building2 },
    { href: "/owner/bookings", label: "Bookings", icon: CalendarDays },
    { href: "/owner/messages", label: "Messages", icon: MessageCircle },
    { href: "/owner/reviews", label: "Reviews", icon: Star },
    { href: "/owner/earnings", label: "Earnings", icon: Wallet },
    { href: "/owner/subscription", label: "Plan", icon: CreditCard },
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
        <Button asChild variant="secondary" size="sm" className="hidden rounded-[var(--radius-md)] sm:inline-flex">
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild size="sm" className="rounded-[var(--radius-md)]">
          <Link href="/register">Register</Link>
        </Button>
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
        <Button
          variant="ghost"
          size="icon"
          className="flex h-9 w-auto items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 hover:bg-[var(--color-bg-overlay)]"
          aria-label="Account menu"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <ChevronDown
            size={14}
            strokeWidth={1.5}
            className="text-[color:var(--color-text-muted)] hidden sm:block"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-56 rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-1 shadow-[var(--shadow-lg)]"
      >
        <div className="px-3 py-2 mb-1">
          <p className="text-[length:var(--text-body-sm)] font-[500] text-[color:var(--color-text-heading)] truncate">
            {user.name}
          </p>
          <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)] truncate">
            {user.email}
          </p>
        </div>

        <DropdownMenuSeparator className="my-1 h-px bg-[var(--color-border-subtle)]" />

        {menuItems.map(({ href, label, icon: Icon }) => {
          const isMobileBottomNavRoute =
            user.role === "STUDENT" &&
            (href === "/dashboard/saved" || href === "/dashboard/messages");

          return (
          <DropdownMenuItem
            key={href}
            asChild
            className={isMobileBottomNavRoute ? "hidden md:flex" : undefined}
          >
            <Link
              href={href}
              className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)] cursor-pointer hover:bg-[var(--color-bg-overlay)] hover:text-[color:var(--color-text-heading)]"
            >
              <Icon size={15} strokeWidth={1.5} aria-hidden="true" />
              {label}
            </Link>
          </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator className="my-1 h-px bg-[var(--color-border-subtle)]" />

        <DropdownMenuItem
          onSelect={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-[length:var(--text-body-sm)] text-[color:var(--color-error)] cursor-pointer hover:bg-[var(--color-error-bg)]"
        >
          <LogOut size={15} strokeWidth={1.5} aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
