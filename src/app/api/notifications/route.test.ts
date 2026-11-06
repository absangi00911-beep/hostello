import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    notification: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/notifications", () => ({
  getUnreadCount: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));

import { GET, PUT } from "../../../app/api/notifications/route";
import { auth } from "../../../lib/auth/config";
import { db } from "../../../lib/db";
import { getUnreadCount, markAllNotificationsAsRead } from "../../../lib/notifications";
import { rateLimit } from "../../../lib/rate-limit";

describe("/api/notifications collection route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 59, resetAt: Date.now() + 60_000 });
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", role: "STUDENT" },
      expires: "2026-06-01T00:00:00.000Z",
    });
    vi.mocked(getUnreadCount).mockResolvedValue(2);
    vi.mocked(db.notification.findMany).mockResolvedValue([
      { id: "notification-1", userId: "user-1", read: false },
    ] as Awaited<ReturnType<typeof db.notification.findMany>>);
    vi.mocked(db.notification.count).mockResolvedValue(1);
  });

  it("lists the current user's notifications without dynamic params", async () => {
    const req = new NextRequest("https://hostello.test/api/notifications?limit=50");

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      unreadCount: 2,
      total: 1,
      page: 1,
      limit: 50,
      hasMore: false,
    });
    expect(body.data).toHaveLength(1);
    expect(db.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } }),
    );
    expect(db.notification.count).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
    expect(rateLimit).toHaveBeenCalledWith("notifications:list:user-1", { limit: 60, windowMs: 60_000 });
  });

  it("includes the alert criteria and stay needed for safe SEARCH notification links", async () => {
    vi.mocked(db.notification.findMany).mockResolvedValue([
      {
        id: "notification-search",
        userId: "user-1",
        availabilityAlert: {
          type: "SEARCH",
          hostelId: null,
          searchCriteria: { city: "Lahore" },
          checkIn: new Date("2030-03-20T00:00:00.000Z"),
          checkOut: new Date("2030-03-22T00:00:00.000Z"),
          guests: 2,
        },
      },
    ] as any);

    const response = await GET(
      new NextRequest("https://hostello.test/api/notifications"),
    );
    const body = await response.json();

    expect(body.data[0].availabilityAlert).toEqual({
      type: "SEARCH",
      criteria: { city: "Lahore" },
      checkIn: "2030-03-20T00:00:00.000Z",
      checkOut: "2030-03-22T00:00:00.000Z",
      guests: 2,
    });
    expect(db.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          availabilityAlert: {
            select: {
              type: true,
              hostelId: true,
              searchCriteria: true,
              checkIn: true,
              checkOut: true,
              guests: true,
            },
          },
        },
      }),
    );
  });

  it("does not list notifications for an unauthenticated request", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);

    const response = await GET(
      new NextRequest("https://hostello.test/api/notifications"),
    );

    expect(response.status).toBe(401);
    expect(db.notification.findMany).not.toHaveBeenCalled();
    expect(db.notification.count).not.toHaveBeenCalled();
  });

  it("throttles notification listing before database reads", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });

    const response = await GET(new NextRequest("https://hostello.test/api/notifications"));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
    expect(body.error).toMatch(/too many notification requests/i);
    expect(db.notification.findMany).not.toHaveBeenCalled();
    expect(db.notification.count).not.toHaveBeenCalled();
    expect(getUnreadCount).not.toHaveBeenCalled();
  });

  it("marks all notifications read from the collection route", async () => {
    const req = new NextRequest("https://hostello.test/api/notifications", {
      method: "PUT",
      body: JSON.stringify({ action: "read-all" }),
    });

    const res = await PUT(req);

    expect(res.status).toBe(200);
    expect(markAllNotificationsAsRead).toHaveBeenCalledWith("user-1");
    expect(rateLimit).toHaveBeenCalledWith("notifications:read-all:user-1", { limit: 5, windowMs: 60_000 });
  });

  it("does not mark notifications read for an unauthenticated request", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null);

    const response = await PUT(
      new NextRequest("https://hostello.test/api/notifications", {
        method: "PUT",
        body: JSON.stringify({ action: "read-all" }),
      }),
    );

    expect(response.status).toBe(401);
    expect(markAllNotificationsAsRead).not.toHaveBeenCalled();
  });

  it("throttles read-all before parsing the request body or updating notifications", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ ok: false, remaining: 0, resetAt: Date.now() + 10_000 });
    const request = new NextRequest("https://hostello.test/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });

    const response = await PUT(request);

    expect(response.status).toBe(429);
    expect(markAllNotificationsAsRead).not.toHaveBeenCalled();
  });
});
