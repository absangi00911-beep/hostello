// Path: src/components/layout/NotificationBell.tsx

"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

interface NotificationsResponse {
  unreadCount: number; // computed server-side by getUnreadCount()
  total: number;
}

export function NotificationBell() {
  const { data: session } = useSession();

  const { data } = useQuery<NotificationsResponse>({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?limit=1");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    // Poll every 60 seconds when the tab is focused
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    enabled: !!session,
  });

  // unreadCount is returned directly by the API (computed by getUnreadCount())
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <Link
      href="/notifications"
      aria-label={
        unreadCount > 0
          ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
          : "Notifications"
      }
      className="relative flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] text-[var(--color-text-muted)] transition-colors duration-[var(--transition-fast)] hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-text-body)]"
    >
      <Bell size={18} strokeWidth={1.5} aria-hidden="true" />
      {unreadCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-action)] px-1 text-[10px] font-600 leading-none text-[var(--color-text-inverse)]"
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
