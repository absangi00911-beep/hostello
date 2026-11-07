"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { announceUnreadCount } from "./useUnreadNotificationCount";
import { buildAvailabilityAlertSearchResultsHref } from "@/lib/availability-alert-links";

type AvailabilityAlertNotificationData = {
  type: "HOSTEL" | "SEARCH";
  criteria: unknown;
  checkIn: string;
  checkOut: string;
  guests: number;
};

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  bookingId: string | null;
  hostelId: string | null;
  availabilityAlert?: AvailabilityAlertNotificationData | null;
}

interface NotificationsResponse {
  data: NotificationItem[];
  unreadCount: number;
  hasMore: boolean;
  page: number;
}

type Role = "STUDENT" | "OWNER" | "ADMIN";
const NOTIFICATION_PAGE_SIZE = 20;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNotificationItem(value: unknown): value is NotificationItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.type === "string" &&
    typeof value.title === "string" &&
    typeof value.message === "string" &&
    typeof value.read === "boolean" &&
    typeof value.createdAt === "string" &&
    (typeof value.bookingId === "string" || value.bookingId == null) &&
    (typeof value.hostelId === "string" || value.hostelId == null)
  );
}

function parseAvailabilityAlert(value: unknown): AvailabilityAlertNotificationData | null {
  if (
    !isRecord(value) ||
    (value.type !== "HOSTEL" && value.type !== "SEARCH") ||
    typeof value.checkIn !== "string" ||
    typeof value.checkOut !== "string" ||
    typeof value.guests !== "number"
  ) {
    return null;
  }
  return {
    type: value.type,
    criteria: value.criteria,
    checkIn: value.checkIn,
    checkOut: value.checkOut,
    guests: value.guests,
  };
}

function parseResponse(value: unknown): NotificationsResponse | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.data) ||
    !value.data.every(isNotificationItem) ||
    typeof value.unreadCount !== "number" ||
    typeof value.hasMore !== "boolean" ||
    typeof value.page !== "number"
  ) {
    return null;
  }
  return {
    data: value.data.map((item) => ({
      ...item,
      bookingId: item.bookingId ?? null,
      hostelId: item.hostelId ?? null,
      availabilityAlert: parseAvailabilityAlert(item.availabilityAlert),
    })),
    unreadCount: value.unreadCount,
    hasMore: value.hasMore,
    page: value.page,
  };
}

function readApiError(value: unknown, fallback: string): string {
  return isRecord(value) && typeof value.error === "string"
    ? value.error
    : fallback;
}

/**
 * Only same-origin, role-appropriate destinations that exist today are linked.
 * Anything else renders as plain text rather than guessing a route.
 */
export function getNotificationHref(
  item: Pick<NotificationItem, "type" | "bookingId" | "hostelId"> &
    Pick<NotificationItem, "availabilityAlert">,
  role: Role,
): string | null {
  switch (item.type) {
    case "MESSAGE_RECEIVED":
      return role === "ADMIN" ? null : "/messages";
    case "BOOKING_REQUEST":
      if (role === "OWNER") return "/owner/bookings";
      return role === "STUDENT" ? "/trips" : null;
    case "BOOKING_CONFIRMED":
    case "BOOKING_CANCELLED":
    case "BOOKING_COMPLETED":
    case "BOOKING_REFUNDED":
      return role === "STUDENT" ? "/trips" : null;
    case "REVIEW_RECEIVED":
      return role === "OWNER" ? "/owner/reviews" : null;
    case "HOSTEL_APPROVED":
    case "HOSTEL_REJECTED":
      return role === "OWNER" ? "/owner" : null;
    case "STUDENT_VERIFICATION_APPROVED":
    case "STUDENT_VERIFICATION_REJECTED":
      return role === "STUDENT" ? "/profile" : null;
    case "PRICE_ALERT":
      return role === "STUDENT" &&
        item.hostelId &&
        /^[a-zA-Z0-9_-]{1,128}$/.test(item.hostelId)
        ? `/hostels/${encodeURIComponent(item.hostelId)}`
        : null;
    case "AVAILABILITY_ALERT":
      if (role !== "STUDENT") return null;
      if (item.availabilityAlert?.type === "SEARCH") {
        return buildAvailabilityAlertSearchResultsHref({
          criteria: item.availabilityAlert.criteria,
          checkIn: item.availabilityAlert.checkIn,
          checkOut: item.availabilityAlert.checkOut,
          guests: item.availabilityAlert.guests,
        }) ?? "/student/availability-alerts";
      }
      return "/student/availability-alerts";
    default:
      return null;
  }
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

const actionClassName =
  "inline-flex min-h-11 items-center justify-center cursor-pointer rounded-[8px] border border-line bg-white px-3 py-2 text-[0.8rem] font-semibold text-ink shadow-[0_1px_2px_rgb(15_23_42/0.06)] transition-[background-color,border-color,box-shadow,translate] duration-150 hover:border-line-strong hover:bg-surface-muted active:translate-y-px active:bg-line active:shadow-none disabled:shadow-none disabled:active:translate-y-0 motion-reduce:transition-none motion-reduce:active:translate-y-0 disabled:cursor-wait disabled:opacity-60 btn-secondary";

export function NotificationsPage({ role }: { role: Role }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<{
    label: string;
    run: () => Promise<void>;
  } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (nextPage: number, signal?: AbortSignal) => {
    const response = await fetch(
      `/api/notifications?page=${nextPage}&limit=${NOTIFICATION_PAGE_SIZE}`,
      { signal },
    );
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(readApiError(payload, "Could not load notifications."));
    }
    const parsed = parseResponse(payload);
    if (!parsed) throw new Error("Could not load notifications.");
    return parsed;
  }, []);

  const loadFirstPage = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const result = await load(1, signal);
        setItems(result.data);
        setUnreadCount(result.unreadCount);
        setHasMore(result.hasMore);
      } catch (error) {
        if (signal?.aborted) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load notifications.",
        );
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [load],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadFirstPage(controller.signal);
    return () => controller.abort();
  }, [loadFirstPage]);

  // Keep the shared header badge in step with what this page shows.
  useEffect(() => {
    if (!isLoading && !loadError) announceUnreadCount(unreadCount);
  }, [isLoading, loadError, unreadCount]);

  function clearActionError() {
    setActionError(null);
    setRetryAction(null);
  }

  async function loadMore() {
    setIsLoadingMore(true);
    clearActionError();
    try {
      const nextPage = Math.floor(items.length / NOTIFICATION_PAGE_SIZE) + 1;
      const result = await load(nextPage);
      if (result.data.length === 0) {
        const currentPage = Math.max(
          1,
          Math.ceil(items.length / NOTIFICATION_PAGE_SIZE),
        );
        const refreshed = await load(currentPage);
        setItems((current) => [
          ...current.slice(
            0,
            (currentPage - 1) * NOTIFICATION_PAGE_SIZE,
          ),
          ...refreshed.data,
        ]);
        setUnreadCount(refreshed.unreadCount);
        setHasMore(refreshed.hasMore);
        setAnnouncement(
          "Notifications have changed. The current page has been refreshed.",
        );
        return;
      }
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...result.data.filter((item) => !seen.has(item.id))];
      });
      setUnreadCount(result.unreadCount);
      setHasMore(result.hasMore);
      setAnnouncement(
        `Loaded ${result.data.length} more notification${
          result.data.length === 1 ? "" : "s"
        }.`,
      );
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not load more.");
      setRetryAction({
        label: "Load more notifications",
        run: () => loadMore(),
      });
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function markRead(id: string) {
    setBusyId(id);
    clearActionError();
    try {
      const response = await fetch(`/api/notifications/${encodeURIComponent(id)}`, {
        method: "PUT",
      });
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        throw new Error(readApiError(payload, "Could not mark as read."));
      }
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, read: true } : item)),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
      setAnnouncement("Notification marked as read.");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not mark as read.",
      );
      setRetryAction({
        label: "Mark notification as read",
        run: () => markRead(id),
      });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(item: NotificationItem) {
    setBusyId(item.id);
    clearActionError();
    try {
      const response = await fetch(
        `/api/notifications/${encodeURIComponent(item.id)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        throw new Error(readApiError(payload, "Could not delete notification."));
      }
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      if (!item.read) setUnreadCount((count) => Math.max(0, count - 1));
      setAnnouncement("Notification deleted.");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not delete notification.",
      );
      setRetryAction({
        label: "Delete notification",
        run: () => remove(item),
      });
    } finally {
      setBusyId(null);
    }
  }

  async function markAllRead() {
    setBusyId("all");
    clearActionError();
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read-all" }),
      });
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        throw new Error(readApiError(payload, "Could not mark all as read."));
      }
      setItems((current) => current.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
      setAnnouncement("All notifications marked as read.");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not mark all as read.",
      );
      setRetryAction({
        label: "Mark all notifications as read",
        run: () => markAllRead(),
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main
      aria-busy={isLoading || isLoadingMore}
      className="mx-auto w-full max-w-[760px] px-4 pb-24 pt-8"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-[1.75rem] font-bold text-ink">Notifications</h1>
          <p aria-live="polite" className="m-0 text-[0.9rem] text-muted" role="status">
            {isLoading
              ? "Loading…"
              : unreadCount === 0 && items.length > 0
                ? "You’re all caught up."
                : `${unreadCount} unread`}
          </p>
        </div>
        <button
          className={actionClassName}
          disabled={busyId !== null || unreadCount === 0}
          onClick={markAllRead}
          type="button"
        >
          Mark all as read
        </button>
      </div>

      {actionError ? (
        <div
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-surface-muted px-[13px] py-[11px] text-[0.875rem] text-danger"
          role="alert"
        >
          <p className="m-0">{actionError}</p>
          {retryAction ? (
            <button
              className={actionClassName}
              disabled={busyId !== null || isLoadingMore}
              aria-label={`Retry: ${retryAction.label}`}
              onClick={() => void retryAction.run()}
              type="button"
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}
      <p aria-live="polite" className="sr-only" role="status">
        {announcement}
      </p>

      {isLoading ? (
        <p aria-live="polite" className="text-muted" role="status">
          Loading notifications...
        </p>
      ) : loadError ? (
        <div className="rounded-[14px] bg-surface-muted p-4" role="alert">
          <p className="m-0 text-danger">{loadError}</p>
          <button
            className={`${actionClassName} mt-3`}
            onClick={() => void loadFirstPage()}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <p
          className="rounded-[14px] border border-line bg-surface p-6 text-center text-muted"
          role="status"
        >
          You’re all caught up.
        </p>
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0">
          {items.map((item) => {
            const href = getNotificationHref(item, role);
            return (
              <li
                className={`rounded-[14px] border p-4 ${
                  item.read
                    ? "border-line bg-surface"
                    : "border-brand bg-brand-soft"
                }`}
                key={item.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="m-0 text-[0.95rem] font-semibold text-ink">
                      {item.title}
                    </p>
                    <p className="mb-0 mt-1 text-[0.9rem] text-ink">
                      {item.message}
                    </p>
                    <p className="mb-0 mt-1 text-[0.8125rem] text-muted">
                      <span
                        className={
                          item.read
                            ? "font-medium"
                            : "font-semibold text-brand"
                        }
                      >
                        {item.read ? "Read" : "Unread"}
                      </span>
                      {formatWhen(item.createdAt) ? (
                        <>
                          {" · "}
                          <time dateTime={item.createdAt}>
                            {formatWhen(item.createdAt)}
                          </time>
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {href ? (
                    <Link
                      aria-label={`View notification: ${item.title}`}
                      className={`${actionClassName} no-underline`}
                      href={href}
                    >
                      View
                    </Link>
                  ) : null}
                  {!item.read ? (
                    <button
                      aria-label={`Mark notification as read: ${item.title}`}
                      className={actionClassName}
                      disabled={busyId !== null}
                      onClick={() => markRead(item.id)}
                      type="button"
                    >
                      Mark as read
                    </button>
                  ) : null}
                  <button
                    aria-label={`Delete notification: ${item.title}`}
                    className={actionClassName}
                    disabled={busyId !== null}
                    onClick={() => remove(item)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {hasMore ? (
        <div className="mt-5 text-center">
          <button
            className={actionClassName}
            disabled={isLoadingMore}
            onClick={loadMore}
            type="button"
          >
            {isLoadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
    </main>
  );
}
