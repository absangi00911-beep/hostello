import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: {
    hostel: { aggregate: vi.fn() },
    booking: { groupBy: vi.fn(), aggregate: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

import { GET } from "./route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue({ user: { id: "owner_1", role: "OWNER" } } as never);
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 9, resetAt: Date.now() + 60_000 });
  vi.mocked(db.hostel.aggregate).mockResolvedValue({
    _count: { _all: 1 },
    _sum: { viewCount: 75 },
  } as never);
  vi.mocked(db.booking.groupBy).mockResolvedValue([
    { status: "PENDING", _count: { id: 3 } },
    { status: "CONFIRMED", _count: { id: 2 } },
    { status: "COMPLETED", _count: { id: 1 } },
  ] as never);
  vi.mocked(db.booking.aggregate).mockResolvedValue({ _sum: { total: 15_000 } } as never);
  vi.mocked(db.$queryRaw).mockResolvedValue([] as never);
});

describe("GET /api/owner/analytics", () => {
  it("uses aggregates and an owner-scoped monthly query instead of loading booking rows", async () => {
    const now = new Date();
    const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    vi.mocked(db.$queryRaw).mockResolvedValueOnce([
      { month: monthKey(previousMonth), bookings: "4", revenue: "1200" },
      { month: monthKey(now), bookings: "2", revenue: "2500" },
    ] as never);

    const response = await GET(new NextRequest("https://hostello.test/api/owner/analytics"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      totalViews: 75,
      totalRequests: 6,
      confirmedBookings: 3,
      totalRevenue: 15_000,
    });
    expect(db.hostel.aggregate).toHaveBeenCalledWith({
      where: { ownerId: "owner_1" },
      _count: { _all: true },
      _sum: { viewCount: true },
    });
    expect(db.booking.groupBy).toHaveBeenCalledWith(expect.objectContaining({
      where: { hostel: { is: { ownerId: "owner_1" } } },
    }));
    expect(db.booking.aggregate).toHaveBeenCalledWith(expect.objectContaining({
      where: { hostel: { is: { ownerId: "owner_1" } }, paymentStatus: "PAID" },
    }));

    expect(db.$queryRaw).toHaveBeenCalledTimes(1);
    const queryCall = vi.mocked(db.$queryRaw).mock.calls[0];
    expect(queryCall[0].join(" ")).toContain('INNER JOIN hostels AS h ON h.id = b."hostelId"');
    expect(queryCall[0].join(" ")).toContain('h."ownerId" = ');
    expect(queryCall).toContain("owner_1");
    expect(queryCall).toContainEqual(expect.any(Date));
    expect(body.byMonth).toHaveLength(6);
    expect(body.byMonth.at(-1)).toMatchObject({ bookings: 2, revenue: 2500 });
    expect(body.byMonth.at(-2)).toMatchObject({ bookings: 4, revenue: 1200 });
  });

  it("avoids booking queries when the owner has no hostels", async () => {
    vi.mocked(db.hostel.aggregate).mockResolvedValueOnce({
      _count: { _all: 0 },
      _sum: { viewCount: null },
    } as never);

    const response = await GET(new NextRequest("https://hostello.test/api/owner/analytics"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.totalViews).toBe(0);
    expect(body.totalRequests).toBe(0);
    expect(db.booking.groupBy).not.toHaveBeenCalled();
    expect(db.booking.aggregate).not.toHaveBeenCalled();
    expect(db.$queryRaw).not.toHaveBeenCalled();
  });

  it("rate-limits expensive analytics before aggregation queries", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ ok: false, remaining: 0, resetAt: Date.now() + 60_000 });

    const response = await GET(new NextRequest("https://hostello.test/api/owner/analytics"));

    expect(response.status).toBe(429);
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(rateLimit).toHaveBeenCalledWith("owner-analytics:owner_1", {
      limit: 10,
      windowMs: 60_000,
    });
    expect(db.hostel.aggregate).not.toHaveBeenCalled();
    expect(db.booking.groupBy).not.toHaveBeenCalled();
    expect(db.booking.aggregate).not.toHaveBeenCalled();
    expect(db.$queryRaw).not.toHaveBeenCalled();
  });
});
