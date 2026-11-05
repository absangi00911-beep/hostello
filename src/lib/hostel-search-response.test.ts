import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { hostel: { findMany: mocks.findMany } },
}));

import { fetchHostelSearchResults } from "./hostel-search-response";

describe("fetchHostelSearchResults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only public listing-card fields even if persistence includes private data", async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: "hostel-1",
        slug: "green-view",
        name: "Green View",
        city: "Lahore",
        area: "Gulberg",
        pricePerMonth: 22000,
        coverImage: null,
        images: [],
        rating: 4.5,
        reviewCount: 2,
        ownerId: "owner-private-id",
        owner: { id: "owner-private-id", name: "Host", email: "private@example.test" },
        featured: true,
        safetyScore: 98,
        address: "Private street address",
      },
    ] as never);

    const results = await fetchHostelSearchResults(["hostel-1"]);

    expect(results).toEqual([
      {
        id: "hostel-1",
        slug: "green-view",
        name: "Green View",
        city: "Lahore",
        area: "Gulberg",
        pricePerMonth: 22000,
        coverImage: null,
        images: [],
        rating: 4.5,
        reviewCount: 2,
      },
    ]);
    expect(JSON.stringify(results)).not.toMatch(
      /owner-private-id|private@example\.test|Private street|safetyScore|featured/,
    );
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          id: true,
          slug: true,
          name: true,
          city: true,
          area: true,
          pricePerMonth: true,
          coverImage: true,
          images: true,
          rating: true,
          reviewCount: true,
        }),
      }),
    );
  });
});
