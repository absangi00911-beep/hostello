import { describe, expect, it } from "vitest";
import { MIN_INDEXABLE_CITY_HOSTELS, isCityIndexable } from "@/lib/city-indexing";

describe("isCityIndexable", () => {
  it("indexes cities from the minimum count upward", () => {
    expect(isCityIndexable(MIN_INDEXABLE_CITY_HOSTELS)).toBe(true);
    expect(isCityIndexable(MIN_INDEXABLE_CITY_HOSTELS + 40)).toBe(true);
  });

  it("treats cities below the minimum as thin", () => {
    expect(isCityIndexable(MIN_INDEXABLE_CITY_HOSTELS - 1)).toBe(false);
    expect(isCityIndexable(0)).toBe(false);
  });
});
