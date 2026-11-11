import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  db: {
    hostel: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  getIp: vi.fn(() => "203.0.113.10"),
  rateLimit: vi.fn(),
}));

import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { GET } from "./route";

const checkIn = "2099-03-10";
const checkOut = "2099-04-10";
const tx = {
  $queryRaw: vi.fn().mockResolvedValue([]),
  hostel: { findFirst: vi.fn() },
  room: {
    findMany: vi.fn().mockResolvedValue([
      { id: "room_1", capacity: 2 },
      { id: "room_2", capacity: 4 },
    ]),
  },
  seatHold: {
    findMany: vi.fn().mockResolvedValue([{ roomId: "room_1", seatNo: 1 }]),
  },
  blockedDate: {
    findFirst: vi.fn().mockResolvedValue(null),
  },
};

function request(query = `checkIn=${checkIn}&checkOut=${checkOut}&guests=2`) {
  return new NextRequest(
    `https://hostello.test/api/hostels/green-view/availability/exact?${query}`,
  );
}

function params(param = "green-view") {
  return { params: Promise.resolve({ param }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  tx.seatHold.findMany.mockResolvedValue([{ roomId: "room_1", seatNo: 1 }]);
  tx.blockedDate.findFirst.mockResolvedValue(null);
  tx.hostel.findFirst.mockResolvedValue({ id: "hostel_1" });
  vi.mocked(rateLimit).mockResolvedValue({
    ok: true,
    remaining: 59,
    resetAt: Date.now() + 60_000,
  });
  tx.hostel.findFirst.mockResolvedValue({
    id: "hostel_1",
    rooms: [],
  } as never);
  vi.mocked(db.$transaction).mockImplementation(async (callback: any) => callback(tx));
});

describe("GET exact hostel availability", () => {
  it("returns only per-room capacity, whole-stay seats, and fit status from seat holds", async () => {
    const response = await GET(request(), params() as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([
      { roomId: "room_1", capacity: 2, availableSeats: 1, fits: false },
      { roomId: "room_2", capacity: 4, availableSeats: 4, fits: true },
    ]);
    expect(JSON.stringify(body)).not.toContain("bookingId");
    expect(tx.hostel.findFirst).toHaveBeenNthCalledWith(1, {
      where: {
        OR: [{ id: "green-view" }, { slug: "green-view" }],
      },
      select: { id: true },
    });
    expect(tx.hostel.findFirst).toHaveBeenNthCalledWith(2, {
      where: { id: "hostel_1", status: "ACTIVE" },
      select: { id: true },
    });
    const lockCall = tx.$queryRaw.mock.calls.findIndex(
      ([query]) => (query as { values: unknown[] }).values.includes("hostel_1"),
    );
    expect(lockCall).toBeGreaterThanOrEqual(0);
    expect(tx.$queryRaw.mock.invocationCallOrder[lockCall]).toBeLessThan(
      tx.room.findMany.mock.invocationCallOrder[0],
    );
    expect(tx.room.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { hostelId: "hostel_1" },
    }));
  });

  it("rejects invalid, unordered, or missing exact-range filters before database reads", async () => {
    const response = await GET(
      request("checkIn=2099-03-13&checkOut=2099-03-10&guests=2"),
      params() as any,
    );

    expect(response.status).toBe(400);
    expect(tx.hostel.findFirst).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("rate-limits exact-range availability", async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      ok: false,
      remaining: 0,
      resetAt: Date.now() + 30_000,
    });

    const response = await GET(request(), params() as any);

    expect(response.status).toBe(429);
    expect(tx.hostel.findFirst).not.toHaveBeenCalled();
  });

  it("resolves the same public detail identifier when the client has a hostel id", async () => {
    await GET(request(), params("hostel_1") as any);

    expect(tx.hostel.findFirst).toHaveBeenNthCalledWith(1, {
      where: {
        OR: [{ id: "hostel_1" }, { slug: "hostel_1" }],
      },
      select: { id: true },
    });
  });
});
