import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  rateLimit: vi.fn(),
  reviewFindMany: vi.fn(),
  reviewCount: vi.fn(),
  reviewAggregate: vi.fn(),
  bookingFindMany: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));
vi.mock("@/lib/db", () => ({
  db: {
    review: {
      findMany: mocks.reviewFindMany,
      count: mocks.reviewCount,
      aggregate: mocks.reviewAggregate,
    },
    booking: { findMany: mocks.bookingFindMany },
  },
}));

import { GET } from "./route";

const request = () => new NextRequest("https://hostello.test/api/reviews/mine");

describe("GET /api/reviews/mine quota", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "owner_1", role: "OWNER" } });
    mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 29, resetAt: Date.now() + 60_000 });
  });

  it("keeps the endpoint restricted to owners and admins", async () => {
    mocks.auth.mockResolvedValueOnce({ user: { id: "student_1", role: "STUDENT" } });

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.reviewFindMany).not.toHaveBeenCalled();
  });

  it("throttles before review stats and booking queries", async () => {
    mocks.rateLimit.mockResolvedValueOnce({ ok: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const response = await GET(request());

    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(mocks.rateLimit).toHaveBeenCalledWith("reviews:mine:owner_1", {
      limit: 30,
      windowMs: 60_000,
    });
    expect(mocks.reviewFindMany).not.toHaveBeenCalled();
    expect(mocks.reviewCount).not.toHaveBeenCalled();
    expect(mocks.reviewAggregate).not.toHaveBeenCalled();
    expect(mocks.bookingFindMany).not.toHaveBeenCalled();
  });
});
