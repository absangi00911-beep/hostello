import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ search: vi.fn(), fetchResults: vi.fn(), log: vi.fn() }));
vi.mock("next/cache", () => ({ unstable_cache: <T>(fn: T) => fn }));
vi.mock("@/lib/hostel-search", () => ({ searchHostelsWithFallback: mocks.search }));
vi.mock("@/lib/hostel-search-response", () => ({ fetchHostelSearchResults: mocks.fetchResults }));
vi.mock("@/lib/operational-logger", () => ({
  createOperationalLogContext: () => ({ request_id: "req-1" }),
  logOperationalEvent: mocks.log,
}));

import { loadInitialHomeHostels } from "./load-initial-home-hostels";

const listing = (id: string) => ({
  id,
  slug: `slug-${id}`,
  name: `Hostel ${id}`,
  city: "Lahore",
  area: "Gulberg",
  pricePerMonth: 9000,
  coverImage: null,
  images: [],
  rating: 4,
  reviewCount: 2,
});

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.search.mockResolvedValue({ hostelIds: ["a", "b"], total: 2, isSearchDegraded: false });
  mocks.fetchResults.mockResolvedValue([listing("a"), listing("b")]);
});

describe("loadInitialHomeHostels", () => {
  it("runs the search behind the opening tab: newest first, one page of 50", async () => {
    await loadInitialHomeHostels();

    expect(mocks.search).toHaveBeenCalledWith(
      expect.objectContaining({ sort: "newest", page: 1, limit: 50, gender: undefined, maxPrice: undefined }),
      { request_id: "req-1" },
    );
  });

  it("returns the listings in search order", async () => {
    expect(await loadInitialHomeHostels()).toEqual([listing("a"), listing("b")]);
    expect(mocks.fetchResults).toHaveBeenCalledWith(["a", "b"]);
  });

  it("returns an empty list, not null, when there are no hostels yet", async () => {
    mocks.search.mockResolvedValue({ hostelIds: [], total: 0, isSearchDegraded: false });
    mocks.fetchResults.mockResolvedValue([]);
    expect(await loadInitialHomeHostels()).toEqual([]);
  });

  it("returns null, so the browser loads them, when the search fails; logging only a safe summary", async () => {
    mocks.search.mockRejectedValue(Object.assign(new Error("postgres://user:secret@host down"), { code: "ECONNRESET" }));

    expect(await loadInitialHomeHostels()).toBeNull();

    expect(mocks.log).toHaveBeenCalledWith("warn", "home.initial_listings_failed", {
      error_name: "Error",
      error_code: "ECONNRESET",
    });
    expect(JSON.stringify(mocks.log.mock.calls)).not.toContain("secret");
  });

  it("returns null when the loaded data is not in the shape the page renders", async () => {
    mocks.fetchResults.mockResolvedValue([{ id: 1 }]);
    expect(await loadInitialHomeHostels()).toBeNull();
  });
});
