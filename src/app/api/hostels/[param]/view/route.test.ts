import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  hostelUpdateMany: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  getIp: vi.fn(() => "203.0.113.10"),
  rateLimit: mocks.rateLimit,
}));

vi.mock("@/lib/db", () => ({
  db: { hostel: { updateMany: mocks.hostelUpdateMany } },
}));

import { POST } from "./route";

function request(slug: string) {
  return new NextRequest(`https://hostello.test/api/hostels/${encodeURIComponent(slug)}/view`, {
    method: "POST",
  });
}

function context(param: string) {
  return { params: Promise.resolve({ param }) };
}

describe("POST /api/hostels/[param]/view", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 29, resetAt: Date.now() + 60_000 });
    mocks.hostelUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("rejects oversized slugs before rate limiting or database work", async () => {
    const response = await POST(request("x".repeat(201)), context("x".repeat(201)));

    expect(response.status).toBe(400);
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.hostelUpdateMany).not.toHaveBeenCalled();
  });

  it("increments views only for active listings after applying the IP limit", async () => {
    const response = await POST(request("green-view"), context("green-view"));

    expect(response.status).toBe(200);
    expect(mocks.rateLimit).toHaveBeenCalledWith("view:203.0.113.10", {
      limit: 30,
      windowMs: 60_000,
    });
    expect(mocks.hostelUpdateMany).toHaveBeenCalledWith({
      where: { slug: "green-view", status: "ACTIVE" },
      data: { viewCount: { increment: 1 } },
    });
  });
});
