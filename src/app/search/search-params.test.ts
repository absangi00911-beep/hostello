import { describe, expect, it } from "vitest";
import { buildSearchParams } from "./search-params";

describe("buildSearchParams", () => {
  it("serializes supported filters and pagination without inventing fields", () => {
    const params = buildSearchParams({
      city: " Lahore ",
      moveInDate: "2099-03-10",
      guests: 2,
      gender: "FEMALE",
      minPrice: 8000,
      maxPrice: 24000,
      amenities: ["wifi", "laundry"],
      sort: "rating",
      page: 3,
      limit: 20,
    });

    expect(params.toString()).toBe(
      "sort=rating&page=3&limit=20&city=Lahore&moveInDate=2099-03-10&guests=2&gender=FEMALE&minPrice=8000&maxPrice=24000&amenities=wifi&amenities=laundry",
    );
    expect(params.has("verified")).toBe(false);
  });

  it("keeps the query valid when optional filters are empty", () => {
    const params = buildSearchParams({ page: 1, limit: 20 });

    expect(params.toString()).toBe("sort=newest&page=1&limit=20");
  });
});
