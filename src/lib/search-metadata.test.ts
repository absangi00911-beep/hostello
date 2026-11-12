import { describe, expect, it } from "vitest";
import { buildSearchMetadata, hasSearchRefinements } from "@/lib/search-metadata";

describe("hasSearchRefinements", () => {
  it("is false for no parameters, blanks and empty lists", () => {
    expect(hasSearchRefinements({})).toBe(false);
    expect(hasSearchRefinements({ city: "", q: "   ", amenities: [] })).toBe(false);
    expect(hasSearchRefinements({ city: undefined })).toBe(false);
  });

  it("is true when any parameter has a value", () => {
    expect(hasSearchRefinements({ city: "Lahore" })).toBe(true);
    expect(hasSearchRefinements({ amenities: ["wifi"] })).toBe(true);
    expect(hasSearchRefinements({ page: "2" })).toBe(true);
  });
});

describe("buildSearchMetadata", () => {
  it("keeps plain /search indexable with a canonical URL", () => {
    const metadata = buildSearchMetadata({});
    expect(metadata.title).toBe("Search student hostels");
    expect(metadata.alternates?.canonical).toBe("/search");
    expect(metadata.robots).toBeUndefined();
  });

  it("keeps filtered and paged results out of the index but follows their links", () => {
    for (const params of [{ city: "Lahore" }, { q: "fast" }, { page: "3" }, { gender: "FEMALE" }]) {
      expect(buildSearchMetadata(params).robots).toEqual({ index: false, follow: true });
    }
  });
});
