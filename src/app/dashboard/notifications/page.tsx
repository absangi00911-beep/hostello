// Path: src/app/dashboard/notifications/page.tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Bell,
  BookOpen,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Star,
  Building2,
  Trash2,
  Loader2,
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import { useState } from "react";
import { EmptyState, PageSpinner, InlineError } from "@/components/ui/shared";

/* ── Notification type → icon + color ───────────────────── */
const TYPE_CONFIG: Record<
  string,
  { icon: LucideIcon; color: string; bg: string }
> = {
  BOOKING_REQUEST:   { icon: BookOpen,      color: "text-[var(--color-primary)]",  bg: "bg-[var(--color-primary-faint)]" },
  BOOKING_CONFIRMED: { icon: CheckCircle2,  color: "text-[var(--color-success)]",  bg: "bg-[var(--color-success-bg)]" },
  BOOKING_CANCELLED: { icon: XCircle,       color: "text-[var(--color-error)]",    bg: "bg-[var(--color-error-bg)]" },
  BOOKING_COMPLETED: { icon: CheckCircle2,  color: "text-[var(--color-info)]",     bg: "bg-[var(--color-info-bg)]" },
  MESSAGE_RECEIVED:  { icon: MessageCircle, color: "text-[var(--color-primary)]",  bg: "bg-[var(--color-primary-faint)]" },
  REVIEW_RECEIVED:   { icon: Star,          color: "text-[var(--color-warning)]",  bg: "bg-[var(--color-warning-bg)]" },
  HOSTEL_APPROVED:   { icon: Building2,     color: "text-[var(--color-success)]",  bg: "bg-[var(--color-success-bg)]" },
  HOSTEL_REJECTED:   { icon: Building2,     color: "text-[var(--color-error)]",    bg: "bg-[var(--color-error-bg)]" },
};

const DEFAULT_TYPE = { icon: Bell, color: "text-[var(--color-primary)]", bg: "bg-[var(--color-primary-faint)]" };

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
  bookingId?: string | null;
  hostelId?: string | null;
}

/* ── Notification row ────────────────────────────────────── */
function NotificationRow({
  notification,
  onMarkRead,
  onDelete,
  deleting,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const config   = TYPE_CONFIG[notification.type] ?? DEFAULT_TYPE;
  const Icon     = config.icon;
  const timeAgo  = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  return (
    <div
      className={`flex items-start gap-4 rounded-[var(--radius-lg)] border px-4 py-4 transition-colors duration-[300ms] ${
        notification.read
          ? "border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]"
          : "border-[var(--color-primary-light)] bg-[var(--color-primary-faint)]"
      }`}
    >
      {/* Icon */}
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${config.bg}`}>
        <Icon size={17} strokeWidth={1.5} className={config.color} aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">
          {notification.title}
        </p>
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] leading-relaxed">
          {notification.message}
        </p>
        <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
          {timeAgo}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {!notification.read && (
          <button
            onClick={() => onMarkRead(notification.id)}
            aria-label="Mark as read"
            className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-faint)] transition-colors duration-[var(--transition-fast)]"
          >
            <CheckCircle2 size={14} strokeWidth={1.5} aria-hidden="true" />
          </button>
        )}
        <button
          onClick={() => onDelete(notification.id)}
          disabled={deleting}
          aria-label="Delete notification"
          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors duration-[var(--transition-fast)] disabled:opacity-50"
        >
          {deleting ? (
            <Loader2 size={13} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 size={13} strokeWidth={1.5} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<{
    data: Notification[];
    total: number;
  }>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?limit=50");
      if (!res.ok) throw new Error("Failed to load notifications");
      return res.json();
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed to mark as read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", { method: "PUT" });
      if (!res.ok) throw new Error("Failed to mark all as read");
    },
    onSuccess: () => {
      toast.success("All notifications marked as read.");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
    onError: () => toast.error("Couldn't update notifications."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      setDeletingId(id);
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
    onError: () => toast.error("Couldn't delete notification."),
    onSettled: () => setDeletingId(null),
  });

  if (isLoading) return <PageSpinner label="Loading notifications…" />;
  if (isError)   return <InlineError message="Couldn't load your notifications. Please refresh." />;

  const notifications = data?.data ?? [];
  const unreadCount   = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
          {unreadCount > 0
            ? `${unreadCount} unread`
            : `${notifications.length} notification${notifications.length !== 1 ? "s" : ""}`}
        </p>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="inline-flex items-center gap-1.5 text-[var(--text-body-sm)] text-[var(--color-text-link)] hover:underline focus-visible:underline focus-visible:outline-none disabled:opacity-50"
          >
            {markAllReadMutation.isPending && (
              <Loader2 size={13} strokeWidth={1.5} className="animate-spin" aria-hidden="true" />
            )}
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          heading="No notifications"
          description="Booking updates, messages, and hostel approvals will appear here."
        />
      ) : (
        <div className="space-y-2.5" role="list" aria-label="Notifications">
          {notifications.map((n) => (
            <div key={n.id} role="listitem">
              <NotificationRow
                notification={n}
                onMarkRead={(id) => markReadMutation.mutate(id)}
                onDelete={(id) => deleteMutation.mutate(id)}
                deleting={deletingId === n.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}