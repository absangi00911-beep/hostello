import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  hostelFindUnique: vi.fn(),
  rateLimit: vi.fn(),
  createBooking: vi.fn(),
  BookingServiceError: class extends Error {
    constructor(message: string, readonly statusCode: number) {
      super(message);
    }
  },
}));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/booking-service", () => ({
  createBooking: mocks.createBooking,
  BookingServiceError: mocks.BookingServiceError,
}));
vi.mock("@/lib/db", () => ({
  db: {
    booking: { findMany: mocks.findMany, count: mocks.count },
    hostel: { findUnique: mocks.hostelFindUnique },
  },
}));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit }));

import { GET, POST } from "./route";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

describe("GET /api/bookings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "student-1", role: "STUDENT" } });
    mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 59, resetAt: Date.now() + 60_000 });
    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);
  });

  it("throttles booking list reads before count or data queries", async () => {
    mocks.rateLimit.mockResolvedValueOnce({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });

    const response = await GET(new NextRequest("https://hostello.test/api/bookings"));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
    expect(rateLimit).toHaveBeenCalledWith("booking-list:student-1", {
      limit: 60,
      windowMs: 60_000,
    });
    expect(db.booking.findMany).not.toHaveBeenCalled();
    expect(db.booking.count).not.toHaveBeenCalled();
    expect(db.hostel.findUnique).not.toHaveBeenCalled();
  });
});

describe("POST /api/bookings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "student-1", role: "STUDENT" } });
    mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 9, resetAt: Date.now() + 60_000 });
  });

  function request(overrides: Record<string, unknown> = {}) {
    return new NextRequest("https://hostello.test/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hostelId: "clh1234567890123456789012",
        roomId: "room-bsh-1",
        checkIn: "2099-01-01",
        checkOut: "2099-02-01",
        guests: 1,
        paymentMethod: "safepay",
        ...overrides,
      }),
    });
  }

  it("requires a specific room and date-only stay before invoking booking service", async () => {
    const response = await POST(request({ roomId: undefined, checkIn: "2099-01-01T00:00:00.000Z" }));

    expect(response.status).toBe(400);
    expect(mocks.createBooking).not.toHaveBeenCalled();
  });

  it("returns known booking conflicts without exposing database errors", async () => {
    mocks.createBooking.mockRejectedValueOnce(
      new mocks.BookingServiceError("Room availability changed. Please try again.", 409),
    );

    const response = await POST(request());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "Room availability changed. Please try again.",
    });
  });

  it("returns a generic error when booking persistence fails unexpectedly", async () => {
    mocks.createBooking.mockRejectedValueOnce(
      new Error("Database connection failed: sensitive-host.internal"),
    );

    const response = await POST(request());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Could not create booking. Please try again.",
    });
  });
});
