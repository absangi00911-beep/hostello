import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  db: {
    hostel: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  getIp: vi.fn(() => "203.0.113.10"),
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/hostel-search", () => ({
  searchHostelsWithFallback: vi.fn(),
}));

import { POST } from "./route";
import { db } from "@/lib/db";
import { getIp, rateLimit } from "@/lib/rate-limit";
import { searchHostelsWithFallback } from "@/lib/hostel-search";

function request(body: unknown, query = "") {
  return new NextRequest(`https://hostello.test/api/hostels/nearby${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockResolvedValue({
    ok: true,
    remaining: 119,
    resetAt: Date.now() + 60_000,
  });
  vi.mocked(searchHostelsWithFallback).mockResolvedValue({
    hostelIds: ["hst_2", "hst_1"],
    total: 2,
    isSearchDegraded: false,
  });
  vi.mocked(db.hostel.findMany).mockResolvedValue([
    { id: "hst_1", name: "First" },
    { id: "hst_2", name: "Second" },
  ] as never);
});

describe("POST /api/hostels/nearby", () => {
  it("rejects invalid coordinates and move-in filters", async () => {
    const invalidCoordinates = await POST(
      request({ latitude: 91, longitude: 73 }),
    );
    const invalidDate = await POST(
      request({
        latitude: 33.6844,
        longitude: 73.0479,
        moveInDate: "2030-02-30",
      }),
    );
    const guestsWithoutDate = await POST(
      request({ latitude: 33.6844, longitude: 73.0479, guests: 2 }),
    );
    const clientProvidedRadius = await POST(
      request({
        latitude: 33.6844,
        longitude: 73.0479,
        radiusKm: 1,
      }),
    );

    expect(invalidCoordinates.status).toBe(400);
    expect(invalidDate.status).toBe(400);
    expect(guestsWithoutDate.status).toBe(400);
    expect(clientProvidedRadius.status).toBe(400);
    expect(searchHostelsWithFallback).not.toHaveBeenCalled();
  });

  it("passes validated coordinates and date filters to the search service", async () => {
    await POST(
      request({
        latitude: 33.6844,
        longitude: 73.0479,
        moveInDate: "2030-06-15",
        guests: 3,
      }),
    );

    expect(searchHostelsWithFallback).toHaveBeenCalledWith(
      expect.objectContaining({
        nearby: { latitude: 33.6844, longitude: 73.0479 },
        moveInDate: new Date("2030-06-15T00:00:00.000Z"),
        guests: 3,
      }),
      expect.anything(),
    );
    expect(getIp).toHaveBeenCalledOnce();
    expect(rateLimit).toHaveBeenCalledWith("hostel-search:203.0.113.10", {
      limit: 120,
      windowMs: 60_000,
    });
  });

  it("defaults to one student when a move-in date is provided without a count", async () => {
    await POST(
      request({
        latitude: 33.6844,
        longitude: 73.0479,
        moveInDate: "2030-06-15",
      }),
    );

    expect(searchHostelsWithFallback).toHaveBeenCalledWith(
      expect.objectContaining({
        moveInDate: new Date("2030-06-15T00:00:00.000Z"),
        guests: 1,
      }),
      expect.anything(),
    );
  });

  it("returns search results in provider order and paginates without exposing coordinates", async () => {
    const response = await POST(
      request(
        { latitude: 33.6844, longitude: 73.0479 },
        "?page=2&limit=5",
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.map((hostel: { id: string }) => hostel.id)).toEqual([
      "hst_2",
      "hst_1",
    ]);
    expect(body).toMatchObject({
      total: 2,
      page: 2,
      limit: 5,
      hasMore: false,
    });
    expect(searchHostelsWithFallback).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 5 }),
      expect.anything(),
    );
    expect(JSON.stringify(body)).not.toContain("33.6844");
    expect(JSON.stringify(body)).not.toContain("73.0479");
  });

  it("rate-limits nearby searches before calling search providers", async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      ok: false,
      remaining: 0,
      resetAt: Date.now() + 30_000,
    });

    const response = await POST(
      request({ latitude: 33.6844, longitude: 73.0479 }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(searchHostelsWithFallback).not.toHaveBeenCalled();
    expect(db.hostel.findMany).not.toHaveBeenCalled();
  });
});
