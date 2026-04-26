"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, X, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface NotificationBellProps {
  solid?: boolean;
}

export function NotificationBell({ solid = true }: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, loading } = useNotifications();
  const [panelOpen, setPanelOpen] = useState(false);

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
    <div className="relative">
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        className={cn(
          "relative flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors",
          solid
            ? "text-[var(--color-ink)] hover:bg-[var(--color-ground)]"
            : "text-white hover:bg-white/8"
        )}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {Math.min(unreadCount, 9)}
            {unreadCount > 9 && "+"}
          </span>
        )}
      </button>

      <AnimatePresence>
        {panelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPanelOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl border border-[var(--color-border)] shadow-lg overflow-hidden z-50"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        markAllAsRead();
                      }}
                      className="text-xs text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                  <button
                    onClick={() => setPanelOpen(false)}
                    className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-[var(--color-muted)]">Loading...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-[var(--color-muted)]">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--color-border)]">
                    {notifications.map((notif) => (
                      <motion.div
                        key={notif.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className={cn(
                          "px-4 py-3 hover:bg-[var(--color-ground)] transition-colors cursor-pointer",
                          !notif.read && "bg-[var(--color-brand-50)]"
                        )}
                        onClick={() => {
                          if (!notif.read) markAsRead(notif.id);
                          // Redirect to relevant page based on notification type
                          if (notif.booking) {
                            window.location.href = `/dashboard/bookings/${notif.booking.id}`;
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg mt-0.5">{getNotificationIcon(notif.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[var(--color-ink)]">
                              {notif.title}
                            </p>
                            <p className="text-sm text-[var(--color-muted)] line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-xs text-[var(--color-muted)] mt-1">
                              {formatDistanceToNow(new Date(notif.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {!notif.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notif.id);
                                }}
                                className="text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] p-1"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notif.id);
                              }}
                              className="text-[var(--color-muted)] hover:text-red-600 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-[var(--color-border)] text-center">
                  <Link
                    href="/notifications"
                    onClick={() => setPanelOpen(false)}
                    className="text-sm text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] font-medium"
                  >
                    View all notifications
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
