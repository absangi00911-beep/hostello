import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: { favorite: { findMany: vi.fn(), count: vi.fn() } },
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));

import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 59, resetAt: Date.now() + 60_000 });
});

describe("GET /api/favorites", () => {
  it("requires a signed-in user", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const response = await GET(new NextRequest("https://hostello.test/api/favorites"));

    expect(response.status).toBe(401);
    expect(db.favorite.findMany).not.toHaveBeenCalled();
  });

  it("bounds the page and returns only active saved hostels with total metadata", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "usr_student" } } as any);
    vi.mocked(db.favorite.findMany).mockResolvedValue([{
      hostel: { id: "hst_1", slug: "hostel-one", name: "Hostel One" },
    }] as any);
    vi.mocked(db.favorite.count).mockResolvedValue(80 as any);

    const response = await GET(new NextRequest("https://hostello.test/api/favorites?page=2&limit=100"));
    const body = await response.json();

    expect(db.favorite.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "usr_student", hostel: { status: "ACTIVE" } },
      skip: 50,
      take: 50,
    }));
    expect(db.favorite.count).toHaveBeenCalledWith({
      where: { userId: "usr_student", hostel: { status: "ACTIVE" } },
    });
    expect(body).toMatchObject({
      data: [{ id: "hst_1", slug: "hostel-one", name: "Hostel One" }],
      total: 80,
      page: 2,
      limit: 50,
      hasMore: true,
    });
  });

  it("rate-limits saved-hostel reads before database queries", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "usr_student" } } as any);
    vi.mocked(rateLimit).mockResolvedValueOnce({ ok: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const response = await GET(new NextRequest("https://hostello.test/api/favorites"));

    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(rateLimit).toHaveBeenCalledWith("favorites:list:usr_student", {
      limit: 60,
      windowMs: 60_000,
    });
    expect(db.favorite.findMany).not.toHaveBeenCalled();
    expect(db.favorite.count).not.toHaveBeenCalled();
  });
});
