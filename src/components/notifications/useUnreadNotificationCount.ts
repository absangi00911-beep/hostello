"use client";

import { useEffect, useState } from "react";

export const UNREAD_COUNT_EVENT = "hostello:notifications-unread";

/** Lets the notification center push its count to any mounted badge. */
export function announceUnreadCount(count: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<number>(UNREAD_COUNT_EVENT, { detail: count }));
}

export function formatUnreadCount(count: number): string {
  return count > 99 ? "99+" : String(count);
}

/**
 * Reads the signed-in user's unread count once, then follows updates announced
 * by the notification center. The badge is a convenience: if the request fails
 * it stays hidden rather than showing an error in the shared header.
 */
export function useUnreadNotificationCount(enabled: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let announced = false;

    function onAnnounce(event: Event) {
      const detail = (event as CustomEvent<unknown>).detail;
      if (typeof detail === "number" && Number.isFinite(detail)) {
        announced = true;
        setCount(Math.max(0, Math.floor(detail)));
      }
    }
    window.addEventListener(UNREAD_COUNT_EVENT, onAnnounce);

    fetch("/api/notifications?page=1&limit=1", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: unknown) => {
        if (announced || typeof payload !== "object" || payload === null) return;
        const unread = (payload as { unreadCount?: unknown }).unreadCount;
        if (typeof unread === "number" && Number.isFinite(unread)) {
          setCount(Math.max(0, Math.floor(unread)));
        }
      })
      .catch(() => {});

    return () => {
      controller.abort();
      window.removeEventListener(UNREAD_COUNT_EVENT, onAnnounce);
    };
  }, [enabled]);

  return enabled ? count : 0;
}
