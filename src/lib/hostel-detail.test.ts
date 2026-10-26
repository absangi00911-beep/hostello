import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  aggregateReviews: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    hostel: { findFirst: mocks.findFirst },
    review: { aggregate: mocks.aggregateReviews },
  },
}));

import { db } from "@/lib/db";
import { getPublicHostelDetail } from "./hostel-detail";

describe("getPublicHostelDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findFirst.mockResolvedValue(null);
  });

  it("only looks up active listings using a bounded id or slug", async () => {
    await getPublicHostelDetail("murree-student-hostel");

    expect(db.hostel.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { id: "murree-student-hostel" },
            { slug: "murree-student-hostel" },
          ],
          status: "ACTIVE",
        },
      }),
    );
  });

  it("does not query for an empty or oversized route parameter", async () => {
    await expect(getPublicHostelDetail("")).resolves.toBeNull();
    await expect(getPublicHostelDetail("x".repeat(201))).resolves.toBeNull();

    expect(db.hostel.findFirst).not.toHaveBeenCalled();
  });

  it("selects only public listing and available room fields", async () => {
    await getPublicHostelDetail("murree-student-hostel");

    const query = mocks.findFirst.mock.calls[0][0];
    expect(query.select).toMatchObject({
      id: true,
      slug: true,
      name: true,
      city: true,
      area: true,
      description: true,
      pricePerMonth: true,
      amenities: true,
      images: true,
      coverImage: true,
      rating: true,
      reviewCount: true,
      latitude: true,
      longitude: true,
      rooms_rel: {
        where: { available: { gt: 0 } },
        select: {
          id: true,
          name: true,
          description: true,
          pricePerMonth: true,
          capacity: true,
          available: true,
          images: true,
        },
      },
    });
    expect(query.select).not.toHaveProperty("address");
    expect(query.select.owner).toEqual({
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        city: true,
        createdAt: true,
        hostResponseSummary: {
          select: {
            guestStartedThreadCount: true,
            repliedThreadCount: true,
            medianResponseSeconds: true,
          },
        },
      },
    });
    expect(query.select.owner.select).not.toHaveProperty("email");
    expect(query.select.owner.select).not.toHaveProperty("phone");
    expect(query.select.owner.select).not.toHaveProperty("address");
    expect(query.select.owner.select).not.toHaveProperty("password");
    expect(query.select.owner.select).not.toHaveProperty("verificationStatus");
    expect(query.select.owner.select).not.toHaveProperty("subscription");
  });

  it("selects recent public review details and reviewer display names", async () => {
    await getPublicHostelDetail("murree-student-hostel");

    const query = mocks.findFirst.mock.calls[0][0];
    expect(query.select.reviews).toEqual({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        cleanliness: true,
        location: true,
        value: true,
        safety: true,
        ownerReply: true,
        createdAt: true,
        verified: true,
        user: { select: { name: true } },
      },
    });
  });

  it("returns category averages from saved reviews", async () => {
    mocks.findFirst.mockResolvedValueOnce({
      id: "hostel-1",
      reviewCount: 2,
      reviews: [],
    });
    mocks.aggregateReviews
      .mockResolvedValueOnce({ _avg: { cleanliness: 4 } })
      .mockResolvedValueOnce({ _avg: { location: 4.5 } })
      .mockResolvedValueOnce({ _avg: { value: 3.5 } })
      .mockResolvedValueOnce({ _avg: { safety: 5 } });

    const hostel = await getPublicHostelDetail("murree-student-hostel");

    expect(db.review.aggregate).toHaveBeenNthCalledWith(1, {
      where: {
        hostelId: "hostel-1",
        hostel: { is: { status: "ACTIVE" } },
        cleanliness: { gt: 0 },
      },
      _avg: { cleanliness: true },
    });
    expect(db.review.aggregate).toHaveBeenNthCalledWith(2, {
      where: {
        hostelId: "hostel-1",
        hostel: { is: { status: "ACTIVE" } },
        location: { gt: 0 },
      },
      _avg: { location: true },
    });
    expect(db.review.aggregate).toHaveBeenNthCalledWith(3, {
      where: {
        hostelId: "hostel-1",
        hostel: { is: { status: "ACTIVE" } },
        value: { gt: 0 },
      },
      _avg: { value: true },
    });
    expect(db.review.aggregate).toHaveBeenNthCalledWith(4, {
      where: {
        hostelId: "hostel-1",
        hostel: { is: { status: "ACTIVE" } },
        safety: { gt: 0 },
      },
      _avg: { safety: true },
    });
    expect(hostel?.reviewCategoryRatings).toEqual({
      cleanliness: 4,
      location: 4.5,
      value: 3.5,
      safety: 5,
    });
  });

  it("skips category aggregates when a listing has no reviews", async () => {
    mocks.findFirst.mockResolvedValueOnce({
      id: "hostel-1",
      reviewCount: 0,
      reviews: [],
    });

    const hostel = await getPublicHostelDetail("murree-student-hostel");

    expect(hostel?.reviewCategoryRatings).toBeNull();
    expect(db.review.aggregate).not.toHaveBeenCalled();
  });
});
