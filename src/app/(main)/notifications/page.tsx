"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { ArrowLeft, Trash2, Check } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { notifications, unreadCount, loading, markAsRead, deleteNotification, refetch } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[var(--color-ground-muted)] pt-24">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-[var(--color-border)] rounded-lg w-32 mb-6"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white rounded-lg mb-4"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const filteredNotifications = filter === "unread" 
    ? notifications.filter((n) => !n.read)
    : notifications;

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "BOOKING_REQUEST":
        return "bg-blue-50 border-blue-200";
      case "BOOKING_CONFIRMED":
        return "bg-green-50 border-green-200";
      case "BOOKING_CANCELLED":
        return "bg-red-50 border-red-200";
      case "MESSAGE_RECEIVED":
        return "bg-purple-50 border-purple-200";
      case "REVIEW_RECEIVED":
        return "bg-amber-50 border-amber-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "BOOKING_REQUEST":
      case "BOOKING_CONFIRMED":
      case "BOOKING_CANCELLED":
        return "📅";
      case "MESSAGE_RECEIVED":
        return "💬";
      case "REVIEW_RECEIVED":
        return "⭐";
      default:
        return "🔔";
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-ground-muted)] pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-ink)]">Notifications</h1>
              <p className="text-[var(--color-muted)] mt-1">
                You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                filter === f
                  ? "bg-[var(--color-brand-600)] text-white"
                  : "bg-white text-[var(--color-ink)] border border-[var(--color-border)] hover:bg-[var(--color-ground)]"
              )}
            >
              {f === "all" ? "All Notifications" : "Unread"}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg border border-[var(--color-border)] px-6 py-12 text-center">
              <p className="text-[var(--color-muted)]">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  "bg-white rounded-lg border border-[var(--color-border)] p-4 hover:shadow-sm transition-shadow",
                  !notif.read && "bg-[var(--color-brand-50)] border-[var(--color-brand-200)]"
                )}
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{getNotificationIcon(notif.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--color-ink)]">
                          {notif.title}
                        </h3>
                        <p className="text-sm text-[var(--color-muted)] mt-1">
                          {notif.message}
                        </p>
                        <p className="text-xs text-[var(--color-muted)] mt-2">
                          {formatDistanceToNow(new Date(notif.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {notif.booking && (
                          <Link
                            href={`/dashboard/bookings/${notif.booking.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-brand-50)] text-[var(--color-brand-600)] hover:bg-[var(--color-brand-100)] rounded-lg text-xs font-medium transition-colors"
                          >
                            View Booking
                          </Link>
                        )}
                        {!notif.read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] p-1.5 hover:bg-[var(--color-ground)] rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="text-[var(--color-muted)] hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
