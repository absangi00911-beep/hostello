import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  deviceTokenUpsert: vi.fn(),
  deviceTokenDeleteMany: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  db: { deviceToken: { upsert: mocks.deviceTokenUpsert, deleteMany: mocks.deviceTokenDeleteMany } },
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));

import { DELETE, POST } from "@/app/api/device-tokens/route";

describe("/api/device-tokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "student-1" } });
    mocks.deviceTokenUpsert.mockResolvedValue({});
    mocks.deviceTokenDeleteMany.mockResolvedValue({ count: 1 });
    mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 19, resetAt: Date.now() + 3_600_000 });
  });

  it("upserts a validated token for the authenticated user", async () => {
    const response = await POST(new NextRequest("https://hostello.pk/api/device-tokens", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "fcm-device-token", platform: "android" }),
    }));

    expect(response.status).toBe(200);
    expect(mocks.rateLimit).toHaveBeenCalledWith("device-token:student-1", {
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });
    expect(mocks.deviceTokenUpsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { token: "fcm-device-token" },
      create: { token: "fcm-device-token", platform: "android", userId: "student-1" },
    }));
  });

  it("throttles token registration before parsing or writing", async () => {
    mocks.rateLimit.mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 3_600_000 });

    const response = await POST(new NextRequest("https://hostello.pk/api/device-tokens", {
      method: "POST",
      body: "not-json",
    }));

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "Too many device registrations. Try again later." });
    expect(mocks.deviceTokenUpsert).not.toHaveBeenCalled();
  });

  it("only removes a token belonging to the signed-in user", async () => {
    const response = await DELETE(new NextRequest("https://hostello.pk/api/device-tokens", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "fcm-device-token" }),
    }));

    expect(response.status).toBe(200);
    expect(mocks.deviceTokenDeleteMany).toHaveBeenCalledWith({
      where: { token: "fcm-device-token", userId: "student-1" },
    });
  });

  it("throttles token deletion before parsing or writing", async () => {
    mocks.rateLimit.mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 3_600_000 });

    const response = await DELETE(new NextRequest("https://hostello.pk/api/device-tokens", {
      method: "DELETE",
      body: "not-json",
    }));

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "Too many device-token changes. Try again later." });
    expect(mocks.deviceTokenDeleteMany).not.toHaveBeenCalled();
  });
});
