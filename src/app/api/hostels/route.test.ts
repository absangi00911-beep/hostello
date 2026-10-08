import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  db: {
    hostel: { findMany: vi.fn(), count: vi.fn() },
    user: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  getIp: vi.fn(() => "203.0.113.10"),
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/hostel-search", () => ({
  searchHostelsWithFallback: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/hostel-service", () => ({
  createHostelRecord: vi.fn(),
  notifyAdminOfNewListing: vi.fn(),
}));

import { GET, POST } from "./route";
import { db } from "@/lib/db";
import { getIp, rateLimit } from "@/lib/rate-limit";
import { searchHostelsWithFallback } from "@/lib/hostel-search";
import { auth } from "@/lib/auth/config";
import { createHostelRecord, notifyAdminOfNewListing } from "@/lib/hostel-service";

function request(query = "") {
  return new NextRequest(`https://hostello.test/api/hostels${query}`);
}

const validListing = {
  name: "Campus Hostel",
  description: "A comfortable student hostel close to the university campus and transit.",
  city: "Lahore",
  address: "123 Main Street, Lahore",
  pricePerMonth: 15_000,
  rooms: 8,
  capacity: 24,
  gender: "MIXED",
  minStay: 1,
  amenities: ["WiFi"],
  rules: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(rateLimit).mockResolvedValue({ ok: true, remaining: 119, resetAt: Date.now() + 60_000 });
  vi.mocked(searchHostelsWithFallback).mockResolvedValue({
    hostelIds: ["hst_2", "hst_1"],
    total: 2,
    isSearchDegraded: false,
  });
  vi.mocked(db.hostel.findMany).mockResolvedValue([
    { id: "hst_1", name: "First" },
    { id: "hst_2", name: "Second" },
  ] as never);
  vi.mocked(db.user.findUnique).mockResolvedValue({
    id: "owner_1",
    name: "Owner One",
    email: "owner@example.com",
    plan: "FREE",
  } as never);
  vi.mocked(db.hostel.count).mockResolvedValue(0 as never);
  vi.mocked(createHostelRecord).mockResolvedValue({
    id: "hostel_1",
    slug: "campus-hostel",
    name: "Campus Hostel",
    status: "PENDING_REVIEW",
    city: "Lahore",
    pricePerMonth: 15_000,
  } as never);
  vi.mocked(db.$transaction).mockImplementation(async (operation) => {
    if (Array.isArray(operation)) return [] as never;
    const run = operation as (tx: unknown) => Promise<unknown>;
    const tx = {
      user: { findUnique: db.user.findUnique },
      hostel: { count: db.hostel.count },
    };
    return await run(tx) as never;
  });
});

describe("GET /api/hostels", () => {
  it("rejects an oversized query before rate limiting or search work", async () => {
    const response = await GET(request(`?q=${"x".repeat(4_097)}`));

    expect(response.status).toBe(400);
    expect(rateLimit).not.toHaveBeenCalled();
    expect(searchHostelsWithFallback).not.toHaveBeenCalled();
  });

  it("rate-limits public search by trusted client IP before calling search providers", async () => {
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });

    const response = await GET(request("?q=campus"));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(getIp).toHaveBeenCalledOnce();
    expect(rateLimit).toHaveBeenCalledWith("hostel-search:203.0.113.10", {
      limit: 120,
      windowMs: 60_000,
    });
    expect(searchHostelsWithFallback).not.toHaveBeenCalled();
    expect(db.hostel.findMany).not.toHaveBeenCalled();
  });

  it("returns search results in provider relevance order", async () => {
    const response = await GET(request("?q=campus&page=2&limit=5"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.map((hostel: { id: string }) => hostel.id)).toEqual(["hst_2", "hst_1"]);
    expect(searchHostelsWithFallback).toHaveBeenCalledWith(expect.objectContaining({
      q: "campus",
      page: 2,
      limit: 5,
    }), expect.objectContaining({ request_id: expect.any(String) }));
  });
});

describe("POST /api/hostels", () => {
  it("rate-limits owner listing creation before parsing the body or querying the database", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "owner_1", role: "OWNER" } } as never);
    vi.mocked(rateLimit).mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });
    const req = new NextRequest("https://hostello.test/api/hostels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{invalid-json",
    });

    const response = await POST(req);

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(rateLimit).toHaveBeenCalledWith("hostel-create:owner_1", {
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    expect(db.user.findUnique).not.toHaveBeenCalled();
    expect(db.hostel.count).not.toHaveBeenCalled();
    expect(db.$transaction).not.toHaveBeenCalled();
    expect(createHostelRecord).not.toHaveBeenCalled();
  });

  it("checks the plan quota and creates the listing in one serializable transaction", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "owner_1", role: "OWNER" } } as never);
    const req = new NextRequest("https://hostello.test/api/hostels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validListing),
    });

    const response = await POST(req);

    expect(response.status).toBe(201);
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "Serializable",
    });
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { id: "owner_1" },
      select: { name: true, email: true, plan: true },
    });
    expect(db.hostel.count).toHaveBeenCalledWith({ where: { ownerId: "owner_1" } });
    expect(createHostelRecord).toHaveBeenCalledWith(expect.anything(), "owner_1", expect.objectContaining(validListing));
    expect(notifyAdminOfNewListing).toHaveBeenCalledOnce();
  });

  it("rejects an owner at their plan limit without creating a listing", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "owner_1", role: "OWNER" } } as never);
    vi.mocked(db.hostel.count).mockResolvedValueOnce(1 as never);
    const req = new NextRequest("https://hostello.test/api/hostels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validListing),
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.code).toBe("QUOTA_EXCEEDED");
    expect(createHostelRecord).not.toHaveBeenCalled();
    expect(notifyAdminOfNewListing).not.toHaveBeenCalled();
  });

  it("retries serialization conflicts before sending the listing notification", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "owner_1", role: "OWNER" } } as never);
    vi.mocked(db.$transaction).mockRejectedValueOnce({ code: "P2034" });
    const req = new NextRequest("https://hostello.test/api/hostels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validListing),
    });

    const response = await POST(req);

    expect(response.status).toBe(201);
    expect(db.$transaction).toHaveBeenCalledTimes(2);
    expect(createHostelRecord).toHaveBeenCalledOnce();
    expect(notifyAdminOfNewListing).toHaveBeenCalledOnce();
  });
});
