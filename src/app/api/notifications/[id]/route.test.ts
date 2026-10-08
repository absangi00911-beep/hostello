import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: { notification: { deleteMany: vi.fn() } },
}));
vi.mock("@/lib/notifications", () => ({ markNotificationAsRead: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));

import { DELETE, PUT } from "./route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { markNotificationAsRead } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";

function request(method: "PUT" | "DELETE" = "PUT") {
  return new NextRequest("https://hostello.test/api/notifications/n-1", { method });
}

function context(id = "n-1") {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", role: "STUDENT" } } as any);
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 59, resetAt: Date.now() + 60_000 });
  vi.mocked(db.notification.deleteMany).mockResolvedValue({ count: 1 } as any);
  vi.mocked(markNotificationAsRead).mockResolvedValue({ count: 1 } as any);
});

describe("/api/notifications/[id] route", () => {
  it("applies a per-user cap before attempting a scoped notification write", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ ok: false, remaining: 0, resetAt: Date.now() + 20_000 });

    const response = await PUT(request(), context());

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("20");
    expect(rateLimit).toHaveBeenCalledWith("notifications:write:user-1", { limit: 60, windowMs: 60_000 });
    expect(markNotificationAsRead).not.toHaveBeenCalled();
    expect(db.notification.deleteMany).not.toHaveBeenCalled();
  });

  it("only marks the current user's notification as read", async () => {
    const response = await PUT(request(), context());

    expect(response.status).toBe(200);
    expect(markNotificationAsRead).toHaveBeenCalledWith("n-1", "user-1");
  });

  it("does not expose or delete another user's notification", async () => {
    vi.mocked(db.notification.deleteMany).mockResolvedValue({ count: 0 } as any);

    const response = await DELETE(request("DELETE"), context());

    expect(response.status).toBe(404);
    expect(db.notification.deleteMany).toHaveBeenCalledWith({
      where: { id: "n-1", userId: "user-1" },
    });
  });

  it("deletes only the current user's notification in the write query", async () => {
    const response = await DELETE(request("DELETE"), context());

    expect(response.status).toBe(200);
    expect(db.notification.deleteMany).toHaveBeenCalledWith({
      where: { id: "n-1", userId: "user-1" },
    });
  });

  it("returns not found when the notification read-write scope matches no row", async () => {
    vi.mocked(markNotificationAsRead).mockResolvedValue({ count: 0 } as any);

    const response = await PUT(request(), context());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Notification not found." });
  });
});
