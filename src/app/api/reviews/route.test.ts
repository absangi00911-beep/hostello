import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  reviewFindMany: vi.fn(),
  reviewCount: vi.fn(),
  reviewUpsert: vi.fn(),
  hostelUpdate: vi.fn(),
  hostelFindFirst: vi.fn(),
  bookingFindFirst: vi.fn(),
  indexSingleHostel: vi.fn(),
  createNotification: vi.fn(),
  rateLimit: vi.fn(),
  getIp: vi.fn(() => "203.0.113.10"),
}));

vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  db: {
    review: {
      findMany: mocks.reviewFindMany,
      count: mocks.reviewCount,
      upsert: mocks.reviewUpsert,
    },
    hostel: { update: mocks.hostelUpdate, findFirst: mocks.hostelFindFirst },
    booking: { findFirst: mocks.bookingFindFirst },
  },
}));
vi.mock("@/lib/typesense-sync", () => ({ indexSingleHostel: mocks.indexSingleHostel }));
vi.mock("@/lib/notifications", () => ({ createNotification: mocks.createNotification }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.rateLimit, getIp: mocks.getIp }));

import { GET, POST } from "@/app/api/reviews/route";

function makeRequest(query = "") {
  return new NextRequest(`https://hostello.pk/api/reviews${query ? `?${query}` : ""}`);
}

describe("GET /api/reviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue(null);
    mocks.reviewFindMany.mockResolvedValue([]);
    mocks.reviewCount.mockResolvedValue(0);
    mocks.hostelFindFirst.mockResolvedValue({ id: "hostel-1" });
    mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 9, resetAt: Date.now() + 3_600_000 });
  });

  it("returns a bounded public review page for one hostel", async () => {
    const response = await GET(makeRequest("hostelId=hostel-1&page=2&limit=500"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: [], total: 0, page: 2, limit: 50 });
    expect(mocks.reviewFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { hostelId: "hostel-1", hostel: { is: { status: "ACTIVE" } } },
      skip: 50,
      take: 50,
      include: { user: { select: { id: true, name: true, avatar: true } } },
    }));
    expect(mocks.hostelFindFirst).toHaveBeenCalledWith({
      where: { id: "hostel-1", status: "ACTIVE" },
      select: { id: true },
    });
    expect(mocks.reviewCount).toHaveBeenCalledWith({
      where: { hostelId: "hostel-1", hostel: { is: { status: "ACTIVE" } } },
    });
    expect(mocks.rateLimit).toHaveBeenCalledWith("reviews:public:203.0.113.10", {
      limit: 120,
      windowMs: 60_000,
    });
    expect(mocks.auth).not.toHaveBeenCalled();
  });

  it("throttles public review reads before the database lookup", async () => {
    mocks.rateLimit.mockResolvedValueOnce({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });

    const response = await GET(makeRequest("hostelId=hostel-1"));

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
    expect(mocks.hostelFindFirst).not.toHaveBeenCalled();
    expect(mocks.reviewFindMany).not.toHaveBeenCalled();
  });

  it("serves the paginated all-reviews list to administrators only", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });

    const response = await GET(makeRequest("page=2&limit=5"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: [], total: 0, page: 2, limit: 5 });
    expect(mocks.reviewFindMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 5,
      take: 5,
      include: {
        user: { select: { id: true, name: true, email: true } },
        hostel: { select: { id: true, name: true, slug: true } },
      },
    }));
    expect(mocks.reviewCount).toHaveBeenCalledWith();
    expect(mocks.rateLimit).toHaveBeenCalledWith("reviews:admin:admin-1", {
      limit: 60,
      windowMs: 60_000,
    });
  });

  it("throttles the administrator list before reading reviews", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    mocks.rateLimit.mockResolvedValueOnce({ ok: false, remaining: 0, resetAt: Date.now() + 30_000 });

    const response = await GET(makeRequest());

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
    expect(mocks.reviewFindMany).not.toHaveBeenCalled();
    expect(mocks.reviewCount).not.toHaveBeenCalled();
  });

  it("does not expose all reviews without an administrator session", async () => {
    const anonymous = await GET(makeRequest());
    expect(anonymous.status).toBe(401);
    expect(mocks.reviewFindMany).not.toHaveBeenCalled();

    mocks.auth.mockResolvedValueOnce({ user: { id: "owner-1", role: "OWNER" } });
    const owner = await GET(makeRequest());
    expect(owner.status).toBe(403);
    expect(mocks.reviewFindMany).not.toHaveBeenCalled();
  });

  it("does not expose reviews for a non-public hostel", async () => {
    mocks.hostelFindFirst.mockResolvedValue(null);

    const response = await GET(makeRequest("hostelId=hostel-1"));

    expect(response.status).toBe(404);
    expect(mocks.reviewFindMany).not.toHaveBeenCalled();
  });
});

describe("POST /api/reviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "student-1", role: "STUDENT" } });
    mocks.rateLimit.mockResolvedValue({ ok: false, remaining: 0, resetAt: Date.now() + 3_600_000 });
  });

  it("limits review creation and edits before reading the body or writing data", async () => {
    const response = await POST(new NextRequest("https://hostello.pk/api/reviews", {
      method: "POST",
      body: "not-json",
    }));

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "Too many review updates. Try again later." });
    expect(mocks.rateLimit).toHaveBeenCalledWith("review:student-1", {
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    expect(mocks.reviewUpsert).not.toHaveBeenCalled();
  });

  it("allows only students to submit a review", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "owner-1", role: "OWNER" } });

    const response = await POST(new NextRequest("https://hostello.pk/api/reviews", {
      method: "POST",
      body: "not-json",
    }));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Student accounts only." });
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.bookingFindFirst).not.toHaveBeenCalled();
    expect(mocks.reviewUpsert).not.toHaveBeenCalled();
  });

  it("rejects an oversized hostel ID before querying completed bookings", async () => {
    mocks.rateLimit.mockResolvedValue({ ok: true, remaining: 9, resetAt: Date.now() + 3_600_000 });

    const response = await POST(new NextRequest("https://hostello.pk/api/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        hostelId: "h".repeat(129),
        rating: 5,
        comment: "A completed stay at this hostel was very comfortable.",
        cleanliness: 5,
        location: 5,
        value: 5,
        safety: 5,
      }),
    }));

    expect(response.status).toBe(400);
    expect(mocks.bookingFindFirst).not.toHaveBeenCalled();
    expect(mocks.reviewUpsert).not.toHaveBeenCalled();
  });
});
