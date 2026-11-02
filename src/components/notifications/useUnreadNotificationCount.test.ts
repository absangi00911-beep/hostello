import { afterEach, describe, expect, it, vi } from "vitest";
import {
  UNREAD_COUNT_EVENT,
  announceUnreadCount,
  formatUnreadCount,
} from "./useUnreadNotificationCount";

describe("formatUnreadCount", () => {
  it("shows exact counts up to 99 and caps larger ones", () => {
    expect(formatUnreadCount(1)).toBe("1");
    expect(formatUnreadCount(99)).toBe("99");
    expect(formatUnreadCount(100)).toBe("99+");
  });
});

describe("announceUnreadCount", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("broadcasts the count so mounted badges can follow the notification center", () => {
    const target = new EventTarget();
    vi.stubGlobal("window", target);
    const received: unknown[] = [];
    target.addEventListener(UNREAD_COUNT_EVENT, (event) =>
      received.push((event as CustomEvent).detail),
    );

    announceUnreadCount(3);

    expect(received).toEqual([3]);
  });

  it("does nothing when there is no window", () => {
    expect(() => announceUnreadCount(1)).not.toThrow();
  });
});
