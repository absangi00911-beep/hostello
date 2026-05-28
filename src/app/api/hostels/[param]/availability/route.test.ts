import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  db: {
    blockedDate: {
      findMany: vi.fn(),
    },
    booking: {
      findMany: vi.fn(),
    },
    hostel: {
      findUnique: vi.fn(),
    },
  },
}));

import { GET } from "@/app/api/hostels/[param]/availability/route";
import { db } from "@/lib/db";

describe("GET /api/hostels/[param]/availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-24T12:00:00.000Z"));
    vi.mocked(db.hostel.findUnique).mockResolvedValue({
      id: "hostel-1",
      capacity: 40,
    } as Awaited<ReturnType<typeof db.hostel.findUnique>>);
    vi.mocked(db.booking.findMany).mockResolvedValue([]);
    vi.mocked(db.blockedDate.findMany).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("treats owner-blocked dates as unavailable", async () => {
    vi.mocked(db.blockedDate.findMany).mockResolvedValue([
      {
        startDate: new Date("2026-04-30T00:00:00.000Z"),
        endDate: new Date("2026-05-31T23:59:59.999Z"),
      },
    ] as Awaited<ReturnType<typeof db.blockedDate.findMany>>);

    const req = new NextRequest(
      "https://hostello.test/api/hostels/canal-view-hostel/availability",
    );
    const res = await GET(req, {
      params: Promise.resolve({ param: "canal-view-hostel" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data[0]).toMatchObject({
      month: "2026-05",
      occupancyRate: 100,
      available: 0,
    });
  });
});
