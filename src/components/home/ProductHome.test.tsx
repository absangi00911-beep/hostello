import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { fetchSavedHostelSlugs } from "./ProductHome";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchSavedHostelSlugs", () => {
  it("collects saved slugs from every favorites page", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ slug: "first-hostel" }],
          hasMore: true,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ slug: "second-hostel" }],
          hasMore: false,
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchSavedHostelSlugs(new AbortController().signal);

    expect(result).toEqual(new Set(["first-hostel", "second-hostel"]));
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/favorites?page=1&limit=50",
      "/api/favorites?page=2&limit=50",
    ]);
  });

  it("surfaces favorites API failures instead of returning an empty success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Favorites unavailable." }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchSavedHostelSlugs(new AbortController().signal),
    ).rejects.toThrow("Favorites unavailable.");
  });
});
