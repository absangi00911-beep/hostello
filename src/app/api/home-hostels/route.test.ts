import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ load: vi.fn(), rateLimit: vi.fn() }));
vi.mock("next/cache", () => ({ unstable_cache: <T>(fn: T) => fn }));
vi.mock("@/lib/home-hostels", () => ({
  HOME_HOSTELS_REVALIDATE_SECONDS: 60,
  loadHomeHostelsByCity: mocks.load,
}));
vi.mock("@/lib/rate-limit", () => ({ getIp: () => "1.2.3.4", rateLimit: mocks.rateLimit }));

import { GET } from "./route";

const request = (query = "") => new NextRequest(`http://localhost/api/home-hostels${query}`);

beforeEach(() => {
  mocks.load.mockReset();
  mocks.rateLimit.mockReset();
  mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 100, resetAt: Date.now() + 60_000 });
  mocks.load.mockResolvedValue({ data: [{ id: "a" }], total: 1 });
});

describe("GET /api/home-hostels", () => {
  it("returns the listing for the requested category tab", async () => {
    const response = await GET(request("?category=women"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: [{ id: "a" }], total: 1 });
    expect(mocks.load).toHaveBeenCalledWith("women");
  });

  it("defaults to the all-stays tab", async () => {
    await GET(request());
    expect(mocks.load).toHaveBeenCalledWith("all");
  });

  it("rejects an unknown category without querying", async () => {
    const response = await GET(request("?category=nope"));

    expect(response.status).toBe(400);
    expect(mocks.load).not.toHaveBeenCalled();
  });

  it("answers 429 with Retry-After when the caller is over the limit", async () => {
    mocks.rateLimit.mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });

    const response = await GET(request());

    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(mocks.load).not.toHaveBeenCalled();
  });

  it("answers 500 with a generic message when loading fails", async () => {
    mocks.load.mockRejectedValue(new Error("db down: secret detail"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET(request());

    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("secret detail");
  });
});
