import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  db: {
    hostel: { findFirst: vi.fn() },
    booking: { findMany: vi.fn() },
    blockedDate: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  getIp: vi.fn(() => "203.0.113.10"),
  rateLimit: vi.fn(),
}));

import { GET } from "./route";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

function paramsFor(param: string) {
  return { params: Promise.resolve({ param }) };
}

function request() {
  return new NextRequest("https://hostello.test/api/hostels/green-view/availability");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 59, resetAt: Date.now() + 60_000 });
  vi.mocked(db.hostel.findFirst).mockResolvedValue({ id: "hst_1", capacity: 30 } as never);
  vi.mocked(db.booking.findMany).mockResolvedValue([] as never);
  vi.mocked(db.blockedDate.findMany).mockResolvedValue([] as never);
});

describe("GET /api/hostels/[param]/availability", () => {
  it("rejects an oversized slug before running a rate-limit or database query", async () => {
    const response = await GET(request(), paramsFor("x".repeat(201)));

    expect(response.status).toBe(400);
    expect(rateLimit).not.toHaveBeenCalled();
    expect(db.hostel.findFirst).not.toHaveBeenCalled();
  });

  it("rate-limits the expensive public calendar by trusted client IP", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });

    const response = await GET(request(), paramsFor("green-view"));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(rateLimit).toHaveBeenCalledWith("availability:203.0.113.10", {
      limit: 60,
      windowMs: 60_000,
    });
    expect(db.hostel.findFirst).not.toHaveBeenCalled();
  });

  it("returns a 12-month calendar for active listings", async () => {
    const response = await GET(request(), paramsFor("green-view"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(12);
    expect(db.hostel.findFirst).toHaveBeenCalledWith({
      where: { slug: "green-view", status: "ACTIVE" },
      select: { id: true, capacity: true },
    });
    expect(db.booking.findMany).toHaveBeenCalledOnce();
    expect(db.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ checkIn: "asc" }, { id: "asc" }],
        take: 200,
        select: { id: true, checkIn: true, checkOut: true, guests: true },
      }),
    );
    expect(db.blockedDate.findMany).toHaveBeenCalledOnce();
    expect(db.blockedDate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ startDate: "asc" }, { id: "asc" }],
        take: 200,
        select: { id: true, startDate: true, endDate: true },
      }),
    );
  });

  it("pages overlapping bookings and blocked ranges with stable bounded batches", async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 7);
    checkIn.setHours(0, 0, 0, 0);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 1);
    const firstBookingPage = Array.from({ length: 200 }, (_, index) => ({
      id: `booking_${String(index).padStart(3, "0")}`,
      checkIn,
      checkOut,
      guests: 1,
    }));
    const firstBlockedPage = Array.from({ length: 200 }, (_, index) => ({
      id: `blocked_${String(index).padStart(3, "0")}`,
      startDate: checkIn,
      endDate: checkOut,
    }));
    vi.mocked(db.booking.findMany)
      .mockResolvedValueOnce(firstBookingPage as never)
      .mockResolvedValueOnce([
        { id: "booking_200", checkIn, checkOut, guests: 1 },
      ] as never);
    vi.mocked(db.blockedDate.findMany)
      .mockResolvedValueOnce(firstBlockedPage as never)
      .mockResolvedValueOnce([
        { id: "blocked_200", startDate: checkIn, endDate: checkOut },
      ] as never);

    const response = await GET(request(), paramsFor("green-view"));

    expect(response.status).toBe(200);
    expect(db.booking.findMany).toHaveBeenCalledTimes(2);
    expect(db.booking.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ cursor: { id: "booking_199" }, skip: 1, take: 200 }),
    );
    expect(db.blockedDate.findMany).toHaveBeenCalledTimes(2);
    expect(db.blockedDate.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ cursor: { id: "blocked_199" }, skip: 1, take: 200 }),
    );
  });

  it("preserves booking checkout and inclusive blocked-date calendar boundaries", async () => {
    const now = new Date();
    const checkIn = new Date(now.getFullYear(), now.getMonth(), 10, 12);
    const checkOut = new Date(now.getFullYear(), now.getMonth(), 11, 12);
    const blockedDay = new Date(now.getFullYear(), now.getMonth(), 15);
    vi.mocked(db.hostel.findFirst).mockResolvedValue({ id: "hst_1", capacity: 310 } as never);
    vi.mocked(db.booking.findMany).mockResolvedValue([
      { id: "booking_1", checkIn, checkOut, guests: 155 },
    ] as never);
    vi.mocked(db.blockedDate.findMany).mockResolvedValue([
      { id: "blocked_1", startDate: blockedDay, endDate: blockedDay },
    ] as never);

    const response = await GET(request(), paramsFor("green-view"));
    const body = await response.json();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const averageOccupied = 465 / daysInMonth;

    expect(response.status).toBe(200);
    expect(body.data[0]).toMatchObject({
      occupancyRate: Math.round((averageOccupied / 310) * 100),
      available: 310 - Math.round(averageOccupied),
    });
  });
});
