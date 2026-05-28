import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    hostel: {
      findUnique: vi.fn(),
    },
    priceAlert: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { GET, POST } from "@/app/api/price-alerts/route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

describe("/api/price-alerts collection route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", role: "STUDENT" },
      expires: "2026-06-01T00:00:00.000Z",
    });
  });

  it("lists the current user's price alerts", async () => {
    vi.mocked(db.priceAlert.findMany).mockResolvedValue([
      { id: "alert-1", userId: "user-1", hostelId: "clhostel000000000000000001" },
    ] as Awaited<ReturnType<typeof db.priceAlert.findMany>>);

    const res = await GET(new NextRequest("https://hostello.test/api/price-alerts"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(db.priceAlert.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
      }),
    );
  });

  it("creates a price alert from the collection route", async () => {
    vi.mocked(db.hostel.findUnique).mockResolvedValue({
      id: "clhostel000000000000000001",
      pricePerMonth: 20000,
    } as Awaited<ReturnType<typeof db.hostel.findUnique>>);
    vi.mocked(db.priceAlert.findUnique).mockResolvedValue(null);
    vi.mocked(db.priceAlert.create).mockResolvedValue({
      id: "alert-1",
      userId: "user-1",
      hostelId: "clhostel000000000000000001",
      targetPrice: 18000,
    } as Awaited<ReturnType<typeof db.priceAlert.create>>);

    const req = new NextRequest("https://hostello.test/api/price-alerts", {
      method: "POST",
      body: JSON.stringify({
        hostelId: "clhostel000000000000000001",
        targetPrice: 18000,
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.message).toContain("created");
    expect(db.priceAlert.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "user-1",
          hostelId: "clhostel000000000000000001",
          targetPrice: 18000,
        }),
      }),
    );
  });
});
