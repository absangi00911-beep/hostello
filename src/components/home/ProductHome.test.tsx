import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
// Rendering the page without the app's provider: the login dialog is not under test here.
vi.mock("@/components/auth/LoginDialogProvider", () => ({
  useLoginDialog: () => ({ openLogin: vi.fn() }),
}));

import ProductHome, { fetchSavedHostelSlugs } from "./ProductHome";

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

describe("ProductHome server rendering", () => {
  const listing = {
    id: "h1",
    slug: "green-view",
    name: "Green View Hostel",
    city: "Lahore",
    area: "Gulberg",
    pricePerMonth: 12000,
    coverImage: null,
    images: [],
    rating: 4.5,
    reviewCount: 3,
  };

  it("puts the server-rendered listings in the HTML", () => {
    const markup = renderToStaticMarkup(<ProductHome accountUser={null} initialHostels={[listing]} />);
    expect(markup).toContain("Green View Hostel");
  });

  it("renders no listings until the browser loads them when there are none from the server", () => {
    const markup = renderToStaticMarkup(<ProductHome accountUser={null} initialHostels={null} />);
    expect(markup).not.toContain("Green View Hostel");
  });
});
