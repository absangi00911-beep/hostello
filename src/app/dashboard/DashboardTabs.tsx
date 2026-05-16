// Path: src/app/dashboard/DashboardTabs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Heart,
  MessageCircle,
  Bell,
  TrendingDown,
} from "lucide-react";

const TABS = [
  { href: "/dashboard/bookings",      label: "My bookings",   icon: BookOpen },
  { href: "/dashboard/saved",         label: "Saved hostels", icon: Heart },
  { href: "/dashboard/messages",      label: "Messages",      icon: MessageCircle },
  { href: "/dashboard/price-alerts",  label: "Price alerts",  icon: TrendingDown },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
];

export function DashboardTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="flex border-b border-[var(--color-border-subtle)] overflow-x-auto scrollbar-none"
      aria-label="Dashboard navigation"
      style={{ scrollbarWidth: "none" }}
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`
              flex items-center gap-2 h-11 px-4 whitespace-nowrap border-b-2 text-[var(--text-body-sm)] transition-all duration-[var(--transition-fast)] shrink-0
              ${
                isActive
                  ? "border-[var(--color-primary)] text-[var(--color-text-heading)] font-[600]"
                  : "border-transparent text-[var(--color-text-muted)] font-[400] hover:text-[var(--color-text-body)]"
              }
            `}
          >
            <Icon size={15} strokeWidth={1.5} aria-hidden="true" />
            <span className="hidden sm:inline">{label}</span>
            {/* Icon-only on mobile */}
            <span className="sr-only sm:not-sr-only">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
