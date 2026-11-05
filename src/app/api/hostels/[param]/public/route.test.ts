import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getPublicHostelDetail: vi.fn(),
  rateLimit: vi.fn(),
  getIp: vi.fn(() => "203.0.113.10"),
}));

vi.mock("@/lib/hostel-detail", async () => ({
  ...await vi.importActual<typeof import("@/lib/hostel-detail")>(
    "@/lib/hostel-detail",
  ),
  getPublicHostelDetail: mocks.getPublicHostelDetail,
}));
vi.mock("@/lib/rate-limit", () => ({
  getIp: mocks.getIp,
  rateLimit: mocks.rateLimit,
}));

import { GET } from "./route";

const privateHostelFixture = {
  id: "hostel-1",
  slug: "green-view",
  name: "Green View",
  city: "Lahore",
  area: "Gulberg",
  address: "Private street address",
  description: "A student hostel",
  amenities: ["wifi"],
  pricePerMonth: 22000,
  gender: "MIXED",
  rooms: 2,
  capacity: 8,
  minStay: 1,
  maxStay: null,
  cancellationPolicy: "FLEXIBLE",
  images: [],
  coverImage: null,
  verified: true,
  rating: 4.5,
  reviewCount: 2,
  latitude: 31.5,
  longitude: 74.3,
  status: "ACTIVE",
  featured: true,
  safetyScore: 98,
  ownerId: "owner-private-id",
  owner: {
    id: "owner-private-id",
    name: "Host Name",
    email: "private@example.test",
    phone: "+923001234567",
    address: "Owner private address",
    verificationStatus: "APPROVED",
    bio: "Host bio",
    avatar: null,
    city: "Lahore",
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    hostResponseSummary: null,
  },
  rooms_rel: [],
  reviews: [],
  reviewCategoryRatings: null,
};

describe("GET /api/hostels/[param]/public", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getPublicHostelDetail.mockResolvedValue(privateHostelFixture);
    mocks.rateLimit.mockResolvedValue({
      ok: true,
      remaining: 59,
      resetAt: Date.now() + 60_000,
    });
  });

  it("returns public detail while redacting owner contact and admin-only fields", async () => {
    const response = await GET(
      new NextRequest("https://hostello.test/api/hostels/green-view/public"),
      { params: Promise.resolve({ param: "green-view" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      id: "hostel-1",
      slug: "green-view",
      name: "Green View",
      owner: { name: "Host Name", bio: "Host bio", city: "Lahore" },
    });
    expect(body.data.owner).not.toHaveProperty("id");
    expect(body.data.owner).not.toHaveProperty("email");
    expect(body.data.owner).not.toHaveProperty("phone");
    expect(body.data.owner).not.toHaveProperty("address");
    expect(body.data.owner).not.toHaveProperty("verificationStatus");
    expect(body.data).not.toHaveProperty("ownerId");
    expect(body.data).not.toHaveProperty("address");
    expect(body.data).not.toHaveProperty("status");
    expect(body.data).not.toHaveProperty("featured");
    expect(body.data).not.toHaveProperty("safetyScore");
    expect(JSON.stringify(body)).not.toMatch(/private@example\.test|923001234567|owner-private-id/);
  });

  it("returns not found for a listing that is not publicly available", async () => {
    mocks.getPublicHostelDetail.mockResolvedValueOnce(null);

    const response = await GET(
      new NextRequest("https://hostello.test/api/hostels/hidden/public"),
      { params: Promise.resolve({ param: "hidden" }) },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Hostel not found." });
  });
});
