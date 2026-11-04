"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { announceUnreadCount } from "./useUnreadNotificationCount";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  bookingId: string | null;
  hostelId: string | null;
}

interface NotificationsResponse {
  data: NotificationItem[];
  unreadCount: number;
  hasMore: boolean;
  page: number;
}

type Role = "STUDENT" | "OWNER" | "ADMIN";

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
  item: Pick<NotificationItem, "type" | "bookingId" | "hostelId">,
  role: Role,
): string | null {
  if (item.type === "MESSAGE_RECEIVED") {
    return role === "ADMIN" ? null : "/messages";
  }
  if (item.bookingId && role === "STUDENT") return "/trips";
  if (item.hostelId && role === "STUDENT") {
    return `/hostels/${encodeURIComponent(item.hostelId)}`;
  }
  if (item.type === "STUDENT_VERIFICATION_APPROVED" && role === "STUDENT") {
    return "/profile";
  }
  if (item.type === "STUDENT_VERIFICATION_REJECTED" && role === "STUDENT") {
    return "/profile";
  }
  return null;
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
  "cursor-pointer rounded-[8px] border border-line bg-white px-3 py-[6px] text-[0.8rem] font-semibold text-ink shadow-[0_1px_2px_rgb(15_23_42/0.06)] transition-[background-color,border-color,box-shadow,translate] duration-150 hover:border-[#cbd5e1] hover:bg-surface-muted active:translate-y-px active:bg-[#e2e8f0] active:shadow-none disabled:shadow-none disabled:active:translate-y-0 motion-reduce:transition-none motion-reduce:active:translate-y-0 disabled:cursor-wait disabled:opacity-60 btn-secondary";

export function NotificationsPage({ role }: { role: Role }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (nextPage: number, signal?: AbortSignal) => {
    const response = await fetch(`/api/notifications?page=${nextPage}&limit=20`, {
      signal,
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(readApiError(payload, "Could not load notifications."));
    }
    const parsed = parseResponse(payload);
    if (!parsed) throw new Error("Could not load notifications.");
    return parsed;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(1, controller.signal)
      .then((result) => {
        setItems(result.data);
        setUnreadCount(result.unreadCount);
        setHasMore(result.hasMore);
        setPage(result.page);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load notifications.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [load]);

  // Keep the shared header badge in step with what this page shows.
  useEffect(() => {
    if (!isLoading && !loadError) announceUnreadCount(unreadCount);
  }, [isLoading, loadError, unreadCount]);

  async function loadMore() {
    setIsLoadingMore(true);
    setActionError(null);
    try {
      const result = await load(page + 1);
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...result.data.filter((item) => !seen.has(item.id))];
      });
      setUnreadCount(result.unreadCount);
      setHasMore(result.hasMore);
      setPage(result.page);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not load more.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function markRead(id: string) {
    setBusyId(id);
    setActionError(null);
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
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not mark as read.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function remove(item: NotificationItem) {
    setBusyId(item.id);
    setActionError(null);
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
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not delete notification.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function markAllRead() {
    setBusyId("all");
    setActionError(null);
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
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not mark all as read.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[760px] px-4 pb-24 pt-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-[1.75rem] font-bold text-ink">Notifications</h1>
          <p aria-live="polite" className="m-0 text-[0.9rem] text-muted">
            {isLoading
              ? "Loading…"
              : unreadCount === 0
                ? "You're all caught up."
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
        <p
          className="mb-4 rounded-[14px] bg-surface-muted px-[13px] py-[11px] text-[0.875rem] text-[#c13515]"
          role="alert"
        >
          {actionError}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-muted">Loading notifications...</p>
      ) : loadError ? (
        <div className="rounded-[14px] bg-surface-muted p-4" role="alert">
          <p className="m-0 text-[#c13515]">{loadError}</p>
          <button
            className={`${actionClassName} mt-3`}
            onClick={() => window.location.reload()}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-[14px] border border-line bg-surface p-6 text-center text-muted">
          No notifications yet.
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
                      {!item.read ? (
                        <span className="sr-only">Unread: </span>
                      ) : null}
                      {item.title}
                    </p>
                    <p className="mb-0 mt-1 text-[0.9rem] text-ink">
                      {item.message}
                    </p>
                    <p className="mb-0 mt-1 text-[0.78rem] text-muted">
                      {formatWhen(item.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {href ? (
                    <Link
                      className={`${actionClassName} no-underline`}
                      href={href}
                    >
                      View
                    </Link>
                  ) : null}
                  {!item.read ? (
                    <button
                      className={actionClassName}
                      disabled={busyId !== null}
                      onClick={() => markRead(item.id)}
                      type="button"
                    >
                      Mark as read
                    </button>
                  ) : null}
                  <button
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
