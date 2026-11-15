import { describe, expect, it } from "vitest";
import {
  INITIAL_HOME_CATEGORY,
  buildHomeListingsQuery,
  isHostelListing,
  isHostelSearchResponse,
} from "./home-listings";

const listing = (overrides: Record<string, unknown> = {}) => ({
  id: "h1",
  slug: "green-view",
  name: "Green View",
  city: "Lahore",
  area: null,
  pricePerMonth: 9000,
  coverImage: null,
  images: [],
  rating: 4.2,
  reviewCount: 5,
  ...overrides,
});

describe("buildHomeListingsQuery", () => {
  const entries = (category: Parameters<typeof buildHomeListingsQuery>[0]) =>
    Object.fromEntries(buildHomeListingsQuery(category).entries());

  it("opens on all hostels, newest first, up to 50", () => {
    expect(INITIAL_HOME_CATEGORY).toBe("all");
    expect(entries("all")).toEqual({ sort: "newest", page: "1", limit: "50" });
  });

  it("adds exactly the filter each tab stands for", () => {
    expect(entries("top-rated")).toEqual({ sort: "rating", page: "1", limit: "50" });
    expect(entries("women")).toEqual({ sort: "newest", page: "1", limit: "50", gender: "FEMALE" });
    expect(entries("budget")).toEqual({ sort: "newest", page: "1", limit: "50", maxPrice: "20000" });
  });
});

describe("isHostelListing", () => {
  it("accepts a complete listing, with nullable area and cover image", () => {
    expect(isHostelListing(listing())).toBe(true);
    expect(isHostelListing(listing({ area: "Gulberg", coverImage: "https://x/y.jpg" }))).toBe(true);
  });

  it("rejects a missing slug, wrong types and non-string images", () => {
    for (const bad of [
      listing({ slug: undefined }),
      listing({ id: 7 }),
      listing({ pricePerMonth: "9000" }),
      listing({ images: [1] }),
      listing({ rating: null }),
      null,
      "hostel",
    ]) {
      expect(isHostelListing(bad)).toBe(false);
    }
  });
});

describe("isHostelSearchResponse", () => {
  it("accepts listings with a total that is at least as large", () => {
    expect(isHostelSearchResponse({ data: [listing()], total: 1 })).toBe(true);
    expect(isHostelSearchResponse({ data: [listing()], total: 80 })).toBe(true);
    expect(isHostelSearchResponse({ data: [], total: 0 })).toBe(true);
  });

  it("rejects a smaller or non-integer total, bad listings and the wrong shape", () => {
    for (const bad of [
      { data: [listing(), listing()], total: 1 },
      { data: [listing()], total: 1.5 },
      { data: [listing()], total: "1" },
      { data: [{ id: "x" }], total: 1 },
      { data: "nope", total: 0 },
      { total: 0 },
      null,
    ]) {
      expect(isHostelSearchResponse(bad)).toBe(false);
    }
  });
});
