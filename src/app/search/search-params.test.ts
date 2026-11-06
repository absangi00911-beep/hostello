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

  it("preserves keyword and verified filters alongside stay parameters", () => {
    const params = buildSearchParams({
      q: "Near campus",
      city: "Lahore",
      moveInDate: "2099-03-10",
      guests: 2,
      verified: true,
      page: 1,
      limit: 20,
    });

    expect(params.get("q")).toBe("Near campus");
    expect(params.get("city")).toBe("Lahore");
    expect(params.get("moveInDate")).toBe("2099-03-10");
    expect(params.get("guests")).toBe("2");
    expect(params.get("verified")).toBe("true");
  });
});
