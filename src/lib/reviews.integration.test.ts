import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/reviews/route";
import { db } from "@/lib/db";
import * as authConfig from "@/lib/auth/config";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    booking: {
      findFirst: vi.fn(),
    },
    review: {
      upsert: vi.fn(),
      aggregate: vi.fn(),
    },
    hostel: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(db)),
  },
}));

vi.mock("@/lib/typesense-sync", () => ({
  indexSingleHostel: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockRequest(options: {
  userId?: string;
  body: any;
  session?: any;
}) {
  const { userId = "user1", body, session } = options;

  const request = new NextRequest("http://localhost:3000/api/reviews", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const mockAuth = vi.mocked(authConfig.auth);
  
  if (session === null) {
    mockAuth.mockResolvedValueOnce(null);
  } else {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: userId,
        role: "STUDENT",
        name: `User ${userId}`,
        email: `${userId}@example.com`,
      },
    });
  }

  return request;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/reviews (Integration Template)", () => {
  const mockDb = vi.mocked(db);

  beforeAll(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("successfully creates a review for a completed stay", async () => {
    const userId = "s1";
    const hostelId = "h1";
    const reviewData = {
      hostelId,
      rating: 5,
      title: "Great stay",
      comment: "Everything was perfect.",
      cleanliness: 5,
      location: 5,
      value: 5,
      safety: 5,
    };

    // 1. Mock completed booking check
    mockDb.booking.findFirst.mockResolvedValueOnce({ id: "b1" } as any);

    // 2. Mock review upsert
    const mockReview = { id: "r1", ...reviewData, userId, user: { id: userId, name: "Student" } };
    mockDb.review.upsert.mockResolvedValueOnce(mockReview as any);

    // 3. Mock rating aggregation
    mockDb.review.aggregate.mockResolvedValueOnce({
      _avg: { rating: 4.8 },
      _count: { rating: 10 },
    } as any);

    // 4. Mock hostel owner lookup for notification
    mockDb.hostel.findUnique.mockResolvedValueOnce({ id: hostelId, ownerId: "o1", name: "Hostel 1" } as any);

    const res = await POST(mockRequest({ userId, body: reviewData }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.id).toBe("r1");
    expect(body.message).toBe("Review submitted.");

    // Verify database was updated
    expect(mockDb.hostel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: hostelId },
        data: { rating: 4.8, reviewCount: 10 },
      })
    );
  });

  it("rejects review if no completed stay found", async () => {
    const userId = "s1";
    const hostelId = "h1";
    const reviewData = { 
      hostelId, 
      rating: 5, 
      comment: "This is a sufficiently long comment for validation." 
    };

    // Mock NO completed booking
    mockDb.booking.findFirst.mockResolvedValueOnce(null);

    const res = await POST(mockRequest({ userId, body: reviewData }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain("completed a stay");
  });

  it("returns 401 if not authenticated", async () => {
    const res = await POST(mockRequest({ session: null, body: {} }));
    expect(res.status).toBe(401);
  });

  it("returns 400 if validation fails", async () => {
    const userId = "s1";
    const reviewData = { hostelId: "h1", rating: 6 }; // Rating max is 5

    const res = await POST(mockRequest({ userId, body: reviewData }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Validation failed.");
  });
});
