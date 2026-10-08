import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  rateLimit: vi.fn(),
  hostelFindMany: vi.fn(),
  hostelCount: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));
vi.mock("@/lib/db", () => ({
  db: { hostel: { findMany: mocks.hostelFindMany, count: mocks.hostelCount } },
}));

import { GET } from "./route";

const request = () => new NextRequest("https://hostello.test/api/hostels/mine");

describe("GET /api/hostels/mine quota", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "owner_1", role: "OWNER" } });
    mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 59, resetAt: Date.now() + 60_000 });
  });

  it("keeps the collection restricted to owners and admins", async () => {
    mocks.auth.mockResolvedValueOnce({ user: { id: "student_1", role: "STUDENT" } });

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.hostelFindMany).not.toHaveBeenCalled();
  });

  it("throttles before listing and count queries", async () => {
    mocks.rateLimit.mockResolvedValueOnce({ ok: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const response = await GET(request());

    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(mocks.rateLimit).toHaveBeenCalledWith("hostels:mine:owner_1", {
      limit: 60,
      windowMs: 60_000,
    });
    expect(mocks.hostelFindMany).not.toHaveBeenCalled();
    expect(mocks.hostelCount).not.toHaveBeenCalled();
  });
});
