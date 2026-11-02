import { describe, expect, it } from "vitest";
import { getListingStatusLabel, parseListingsPage } from "./ownerListings";

const listing = {
  id: "h1",
  name: "Green Hostel",
  slug: "green-hostel",
  status: "ACTIVE",
  city: "Faisalabad",
  area: null,
  pricePerMonth: 12000,
  rooms: 4,
  capacity: 12,
  coverImage: null,
  rating: 4.5,
  reviewCount: 2,
};

describe("parseListingsPage", () => {
  it("accepts the /api/hostels/mine shape and normalizes nulls", () => {
    const parsed = parseListingsPage({
      data: [{ ...listing, extra: "ignored" }],
      total: 1,
      page: 1,
      limit: 20,
      hasMore: false,
    });

    expect(parsed?.data).toEqual([listing]);
    expect(parsed?.total).toBe(1);
  });

  it("rejects unknown statuses and malformed rows", () => {
    expect(
      parseListingsPage({
        data: [{ ...listing, status: "ARCHIVED" }],
        total: 1,
        page: 1,
        hasMore: false,
      }),
    ).toBeNull();
    expect(parseListingsPage({ data: [{ id: "x" }], total: 1, page: 1, hasMore: false })).toBeNull();
    expect(parseListingsPage(null)).toBeNull();
  });
});

describe("getListingStatusLabel", () => {
  it("uses owner-facing wording", () => {
    expect(getListingStatusLabel("ACTIVE")).toBe("Live");
    expect(getListingStatusLabel("PENDING_REVIEW")).toBe("Pending review");
  });
});
