import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ cities: vi.fn(), search: vi.fn(), fetchResults: vi.fn() }));
vi.mock("@/lib/city-links", () => ({ getCityLinks: mocks.cities }));
vi.mock("@/lib/hostel-search", () => ({ searchHostelsWithFallback: mocks.search }));
vi.mock("@/lib/hostel-search-response", () => ({ fetchHostelSearchResults: mocks.fetchResults }));

import { HOME_CITY_ROW_LIMIT, HOME_HOSTELS_PER_CITY, loadHomeHostelsByCity } from "./home-hostels";

const city = (name: string, hostelCount: number) => ({ slug: name.toLowerCase(), name, hostelCount });

beforeEach(() => {
  for (const fn of Object.values(mocks)) fn.mockReset();
  mocks.fetchResults.mockImplementation(async (ids: string[]) => ids.map((id) => ({ id })));
});

describe("loadHomeHostelsByCity", () => {
  it("loads a few hostels from each city, biggest city first, so no city is crowded out", async () => {
    mocks.cities.mockResolvedValue([city("Lahore", 30), city("Karachi", 20), city("Quetta", 5)]);
    mocks.search.mockImplementation(async ({ city: name }: { city: string }) => ({
      hostelIds: [`${name}-1`, `${name}-2`],
      total: 10,
      isSearchDegraded: false,
    }));

    const result = await loadHomeHostelsByCity("all");

    expect(mocks.cities).toHaveBeenCalledWith({ limit: HOME_CITY_ROW_LIMIT });
    expect(mocks.search.mock.calls.map(([params]) => [params.city, params.page, params.limit])).toEqual([
      ["Lahore", 1, HOME_HOSTELS_PER_CITY],
      ["Karachi", 1, HOME_HOSTELS_PER_CITY],
      ["Quetta", 1, HOME_HOSTELS_PER_CITY],
    ]);
    expect(mocks.fetchResults).toHaveBeenCalledWith([
      "Lahore-1", "Lahore-2", "Karachi-1", "Karachi-2", "Quetta-1", "Quetta-2",
    ]);
    expect(result.total).toBe(30);
  });

  it("keeps the tab's own filters and sort inside every city", async () => {
    mocks.cities.mockResolvedValue([city("Lahore", 30), city("Karachi", 20)]);
    mocks.search.mockResolvedValue({ hostelIds: [], total: 0, isSearchDegraded: false });

    await loadHomeHostelsByCity("women");
    await loadHomeHostelsByCity("top-rated");
    await loadHomeHostelsByCity("budget");

    const calls = mocks.search.mock.calls.map(([params]) => params);
    expect(calls.slice(0, 2).every((p) => p.gender === "FEMALE" && p.sort === "newest")).toBe(true);
    expect(calls.slice(2, 4).every((p) => p.sort === "rating")).toBe(true);
    expect(calls.slice(4, 6).every((p) => p.maxPrice === 20000)).toBe(true);
  });

  it("lists a hostel once and leaves out cities with no matches", async () => {
    mocks.cities.mockResolvedValue([city("Lahore", 30), city("Karachi", 20), city("Quetta", 5)]);
    mocks.search
      .mockResolvedValueOnce({ hostelIds: ["a", "b"], total: 2, isSearchDegraded: false })
      .mockResolvedValueOnce({ hostelIds: ["b", "c"], total: 2, isSearchDegraded: false })
      .mockResolvedValueOnce({ hostelIds: [], total: 0, isSearchDegraded: false });

    await loadHomeHostelsByCity("all");

    expect(mocks.fetchResults).toHaveBeenCalledWith(["a", "b", "c"]);
  });

  it("falls back to the single newest-hostels query when there is no city list", async () => {
    mocks.cities.mockResolvedValue([]);
    mocks.search.mockResolvedValue({ hostelIds: ["x"], total: 1, isSearchDegraded: false });

    const result = await loadHomeHostelsByCity("all");

    expect(mocks.search).toHaveBeenCalledTimes(1);
    expect(mocks.search).toHaveBeenCalledWith(
      expect.objectContaining({ sort: "newest", page: 1, limit: 50, city: undefined }),
      undefined,
    );
    expect(result).toEqual({ data: [{ id: "x" }], total: 1 });
  });
});
