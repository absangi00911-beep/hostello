// Path: src/lib/bookings.test.ts

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/bookings/route";
import { db } from "@/lib/db";
import * as authConfig from "@/lib/auth/config";
import { createBooking } from "@/lib/booking-service";
import { rateLimit } from "@/lib/rate-limit";

// Mock the auth module
vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/booking-service", () => ({
  createBooking: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(),
}));

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    booking: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    hostel: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

// Helper: create a mock NextRequest
function mockRequest(options: {
  role?: "STUDENT" | "OWNER" | "ADMIN";
  userId?: string;
  params?: Record<string, string>;
  session?: any;
}) {
  const { role = "STUDENT", userId = "user1", params = {}, session } = options;

  const url = new URL("http://localhost:3000/api/bookings");
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const request = new NextRequest(url);

  // Mock the auth function
  const mockAuth = vi.mocked(authConfig.auth);
  
  if (session === null) {
    mockAuth.mockResolvedValueOnce(null);
  } else {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: userId,
        role: role || "STUDENT",
        name: `User ${userId}`,
        email: `${userId}@example.com`,
      },
    });
  }

  return request;
}

function mockPostRequest(options: {
  role?: "STUDENT" | "OWNER" | "ADMIN";
  userId?: string;
  body?: Record<string, unknown>;
  session?: unknown;
}) {
  const {
    role = "STUDENT",
    userId = "user1",
    body = {
      hostelId: "clh7x4xb80000qz0g0g0g0g0g",
      roomId: "clh7x4xb80001qz0g0g0g0g0g",
      checkIn: "2030-06-01T00:00:00.000Z",
      checkOut: "2030-09-01T00:00:00.000Z",
      guests: 1,
      paymentMethod: "safepay",
    },
    session,
  } = options;

  const request = new NextRequest("http://localhost:3000/api/bookings", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

  const mockAuth = vi.mocked(authConfig.auth);

  if (session === null) {
    mockAuth.mockResolvedValueOnce(null);
  } else {
    mockAuth.mockResolvedValueOnce({
      user: {
        id: userId,
        role,
        name: `User ${userId}`,
        email: `${userId}@example.com`,
      },
    });
  }

  return request;
}

describe("GET /api/bookings", () => {
  const mockDb = vi.mocked(db);

  beforeAll(async () => {
    // Reset all mocks before tests begin
    vi.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up after tests
    vi.restoreAllMocks();
  });

  it("student sees only their own bookings", async () => {
    const userId = "s1";
    const mockBookings = [
      {
        id: "b1",
        userId,
        hostelId: "h1",
        status: "CONFIRMED",
        createdAt: new Date(),
        hostel: { id: "h1", name: "Hostel 1", slug: "hostel-1", coverImage: null, city: "Karachi" },
      },
    ];

    mockDb.booking.findMany.mockResolvedValueOnce(mockBookings);

    const res = await GET(mockRequest({ role: "STUDENT", userId }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].userId).toBe(userId);
    expect(body.data[0].user).toBeUndefined();
  });

  it("student response does not include user field", async () => {
    const mockBookings = [
      {
        id: "b1",
        userId: "s1",
        hostelId: "h1",
        status: "CONFIRMED",
        createdAt: new Date(),
        hostel: { id: "h1", name: "Hostel 1", slug: "hostel-1", coverImage: null, city: "Karachi" },
      },
    ];

    mockDb.booking.findMany.mockResolvedValueOnce(mockBookings);

    const res = await GET(mockRequest({ role: "STUDENT", userId: "s1" }));
    const body = await res.json();

    expect(body.data[0].user).toBeUndefined();
  });

  it("owner sees bookings for their hostels only", async () => {
    const ownerId = "o1";
    const hostelId = "h1";

    mockDb.hostel.findMany.mockResolvedValueOnce([{ id: hostelId }]);
    mockDb.booking.findMany.mockResolvedValueOnce([
      {
        id: "b1",
        userId: "s1",
        hostelId,
        status: "PENDING",
        createdAt: new Date(),
        hostel: { id: hostelId, name: "Hostel 1", slug: "hostel-1", coverImage: null, city: "Karachi" },
        user: { id: "s1", name: "Student 1", email: "s1@example.com", phone: "+92300000000" },
      },
    ]);
    mockDb.booking.count.mockResolvedValueOnce(1);

    const res = await GET(mockRequest({ role: "OWNER", userId: ownerId }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(mockDb.hostel.findMany).toHaveBeenCalledWith({
      where: { ownerId },
      select: { id: true },
    });
  });

  it("owner response includes user.phone", async () => {
    const ownerId = "o1";

    mockDb.hostel.findMany.mockResolvedValueOnce([{ id: "h1" }]);
    mockDb.booking.findMany.mockResolvedValueOnce([
      {
        id: "b1",
        userId: "s1",
        hostelId: "h1",
        status: "PENDING",
        createdAt: new Date(),
        hostel: { id: "h1", name: "Hostel 1", slug: "hostel-1", coverImage: null, city: "Karachi" },
        user: { id: "s1", name: "Student 1", email: "s1@example.com", phone: "+92300000000" },
      },
    ]);
    mockDb.booking.count.mockResolvedValueOnce(1);

    const res = await GET(mockRequest({ role: "OWNER", userId: ownerId }));
    const body = await res.json();

    expect(body.data[0].user.phone).toBeDefined();
    expect(body.data[0].user.phone).toBe("+92300000000");
  });

  it("owner with ?hostelId for another owner's hostel gets 404", async () => {
    const ownerId = "o1";
    const otherOwnersHostelId = "clh7x4xb80000qz0g0g0g0g0g"; // Valid CUID format

    // Simulate: owner tries to access a hostel they don't own
    mockDb.hostel.findUnique.mockResolvedValueOnce(null);

    const res = await GET(mockRequest({
      role: "OWNER",
      userId: ownerId,
      params: { hostelId: otherOwnersHostelId },
    }));

    expect(res.status).toBe(404);
  });

  it("owner with ?status=PENDING filters correctly", async () => {
    const ownerId = "o1";

    mockDb.hostel.findMany.mockResolvedValueOnce([{ id: "h1" }]);
    mockDb.booking.findMany.mockResolvedValueOnce([
      {
        id: "b1",
        userId: "s1",
        hostelId: "h1",
        status: "PENDING",
        createdAt: new Date(),
        hostel: { id: "h1", name: "Hostel 1", slug: "hostel-1", coverImage: null, city: "Karachi" },
        user: { id: "s1", name: "Student 1", email: "s1@example.com", phone: "+92300000000" },
      },
    ]);
    mockDb.booking.count.mockResolvedValueOnce(1);

    const res = await GET(mockRequest({
      role: "OWNER",
      userId: ownerId,
      params: { status: "PENDING" },
    }));
    const body = await res.json();

    expect(body.data.every((b: any) => b.status === "PENDING")).toBe(true);
  });

  it("owner with no hostels returns empty array not 500", async () => {
    const ownerId = "new-owner-no-hostels";

    mockDb.hostel.findMany.mockResolvedValueOnce([]);

    const res = await GET(mockRequest({ role: "OWNER", userId: ownerId }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("unauthenticated request returns 401", async () => {
    const res = await GET(mockRequest({ session: null }));
    expect(res.status).toBe(401);
  });

  it("invalid status param returns 400", async () => {
    const res = await GET(mockRequest({
      role: "OWNER",
      userId: "o1",
      params: { status: "INVALID" },
    }));
    expect(res.status).toBe(400);
  });

  it("pagination: hasMore is true when more pages exist", async () => {
    const ownerId = "o1-with-many-bookings";

    mockDb.hostel.findMany.mockResolvedValueOnce([
      { id: "h1" },
      { id: "h2" },
    ]);
    
    // Return only 2 bookings when limit=2
    mockDb.booking.findMany.mockResolvedValueOnce([
      {
        id: "b1",
        userId: "s1",
        hostelId: "h1",
        status: "CONFIRMED",
        createdAt: new Date(),
        hostel: { id: "h1", name: "Hostel 1", slug: "hostel-1", coverImage: null, city: "Karachi" },
        user: { id: "s1", name: "Student 1", email: "s1@example.com", phone: "+92300000000" },
      },
      {
        id: "b2",
        userId: "s2",
        hostelId: "h2",
        status: "CONFIRMED",
        createdAt: new Date(),
        hostel: { id: "h2", name: "Hostel 2", slug: "hostel-2", coverImage: null, city: "Karachi" },
        user: { id: "s2", name: "Student 2", email: "s2@example.com", phone: "+92300000001" },
      },
    ]);
    
    // Return total count of 5 to indicate more pages exist
    mockDb.booking.count.mockResolvedValueOnce(5);

    const res = await GET(mockRequest({
      role: "OWNER",
      userId: ownerId,
      params: { limit: "2", page: "1" },
    }));
    const body = await res.json();

    expect(body.hasMore).toBe(true);
    expect(body.data.length).toBe(2);
    expect(body.total).toBe(5);
  });
});

describe("POST /api/bookings", () => {
  beforeAll(async () => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    vi.restoreAllMocks();
  });

  it("rejects owner booking attempts before creating a booking", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ ok: true, remaining: 9, reset: Date.now() + 1000 });
    vi.mocked(createBooking).mockResolvedValueOnce(
      { id: "booking-1" } as unknown as Awaited<ReturnType<typeof createBooking>>,
    );

    const res = await POST(mockPostRequest({ role: "OWNER", userId: "owner-1" }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Only students can book hostels.");
    expect(rateLimit).not.toHaveBeenCalled();
    expect(createBooking).not.toHaveBeenCalled();
  });

  it("rejects admin booking attempts before creating a booking", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ ok: true, remaining: 9, reset: Date.now() + 1000 });
    vi.mocked(createBooking).mockResolvedValueOnce(
      { id: "booking-1" } as unknown as Awaited<ReturnType<typeof createBooking>>,
    );

    const res = await POST(mockPostRequest({ role: "ADMIN", userId: "admin-1" }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Only students can book hostels.");
    expect(rateLimit).not.toHaveBeenCalled();
    expect(createBooking).not.toHaveBeenCalled();
  });
});
