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

import { GET, PUT } from "@/app/api/notifications/route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getUnreadCount, markAllNotificationsAsRead } from "@/lib/notifications";

describe("/api/notifications collection route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  it("marks all notifications read from the collection route", async () => {
    const req = new NextRequest("https://hostello.test/api/notifications", {
      method: "PUT",
      body: JSON.stringify({ action: "read-all" }),
    });

    const res = await PUT(req);

    expect(res.status).toBe(200);
    expect(markAllNotificationsAsRead).toHaveBeenCalledWith("user-1");
  });
});
