import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ search: vi.fn(), fetchResults: vi.fn(), log: vi.fn() }));
vi.mock("@/lib/hostel-search", () => ({ searchHostelsWithFallback: mocks.search }));
vi.mock("@/lib/hostel-search-response", () => ({ fetchHostelSearchResults: mocks.fetchResults }));
vi.mock("@/lib/operational-logger", () => ({
  createOperationalLogContext: () => ({ request_id: "req-1" }),
  logOperationalEvent: mocks.log,
}));

import { loadInitialHostelSearch } from "./load-initial-hostel-search";
import type { HostelSearchRequest } from "./load-hostel-search";

const hostel = (id: string) => ({
  id,
  slug: `slug-${id}`,
  name: `Hostel ${id}`,
  city: "Lahore",
  area: null,
  pricePerMonth: 9000,
  coverImage: null,
  images: [],
  rating: 4,
  reviewCount: 2,
});

const request = (overrides: Partial<HostelSearchRequest> = {}): HostelSearchRequest => ({
  query: "",
  city: "Lahore",
  moveInDate: "",
  checkOutDate: "",
  guests: "1",
  nearby: false,
  filters: { gender: "", minPrice: "", maxPrice: "", amenities: [], verified: false, sort: "newest" },
  page: 1,
  initialNearbyCoordinates: null,
  ...overrides,
});

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.search.mockResolvedValue({ hostelIds: ["a", "b"], total: 2, isSearchDegraded: false });
  mocks.fetchResults.mockResolvedValue([hostel("a"), hostel("b")]);
});

describe("loadInitialHostelSearch", () => {
  it("runs the same search the API would, for the validated parameters", async () => {
    await loadInitialHostelSearch(
      request({
        query: "fast",
        page: 2,
        filters: { gender: "FEMALE", minPrice: "5000", maxPrice: "", amenities: ["wifi"], verified: true, sort: "rating" },
      }),
    );

    expect(mocks.search).toHaveBeenCalledWith(
      expect.objectContaining({
        q: "fast",
        city: "Lahore",
        gender: "FEMALE",
        verified: true,
        minPrice: 5000,
        amenities: ["wifi"],
        sort: "rating",
        page: 2,
        limit: 20,
      }),
      { request_id: "req-1" },
    );
  });

  it("returns the hostels in search order with the total", async () => {
    const result = await loadInitialHostelSearch(request());

    expect(mocks.fetchResults).toHaveBeenCalledWith(["a", "b"]);
    expect(result).toEqual({ hostels: [hostel("a"), hostel("b")], total: 2 });
  });

  it("leaves nearby searches to the browser, which holds the coordinates", async () => {
    expect(await loadInitialHostelSearch(request({ nearby: true, city: "" }))).toBeNull();
    expect(mocks.search).not.toHaveBeenCalled();
  });

  it("returns null for a search the API would reject, so the browser can show the error", async () => {
    // The page does not truncate the city, and the API rejects one over 100 characters.
    expect(await loadInitialHostelSearch(request({ city: "a".repeat(101) }))).toBeNull();
    expect(mocks.search).not.toHaveBeenCalled();
  });

  it("returns null instead of throwing when the search fails, and logs only a safe summary", async () => {
    mocks.search.mockRejectedValue(Object.assign(new Error("password=secret db down"), { code: "ECONNRESET" }));

    expect(await loadInitialHostelSearch(request())).toBeNull();

    expect(mocks.log).toHaveBeenCalledWith("warn", "search.initial_results_failed", {
      error_name: "Error",
      error_code: "ECONNRESET",
    });
    expect(JSON.stringify(mocks.log.mock.calls)).not.toContain("secret");
  });

  it("returns null when the loaded data is not in the shape the client renders", async () => {
    mocks.fetchResults.mockResolvedValue([{ id: 7 }]);
    expect(await loadInitialHostelSearch(request())).toBeNull();
  });

  it("returns an empty result for a search with no matches, not null", async () => {
    mocks.search.mockResolvedValue({ hostelIds: [], total: 0, isSearchDegraded: false });
    mocks.fetchResults.mockResolvedValue([]);
    expect(await loadInitialHostelSearch(request())).toEqual({ hostels: [], total: 0 });
  });
});
