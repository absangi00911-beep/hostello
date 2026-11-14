import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), loadInitial: vi.fn(), client: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("./load-initial-hostel-search", () => ({ loadInitialHostelSearch: mocks.loadInitial }));
vi.mock("./SearchPageClient", () => ({
  default: (props: unknown) => {
    mocks.client(props);
    return null;
  },
}));

import SearchPage from "./page";
import { hostelSearchRequestKey } from "./load-hostel-search";

const render = async (params: Record<string, string | string[]> = {}) => {
  const element = await SearchPage({ searchParams: Promise.resolve(params) });
  return element.props as Record<string, any>;
};

beforeEach(() => {
  mocks.auth.mockReset().mockResolvedValue(null);
  mocks.loadInitial.mockReset().mockResolvedValue(null);
});

describe("search page: server-rendered first results", () => {
  it("passes the loaded results to the client", async () => {
    const results = { hostels: [], total: 0 };
    mocks.loadInitial.mockResolvedValue(results);

    expect((await render()).initialResults).toBe(results);
  });

  it("passes null, so the browser loads them, when the server could not", async () => {
    expect((await render({ city: "Lahore" })).initialResults).toBeNull();
  });

  it("loads the first results for exactly the search the client would otherwise request", async () => {
    const props = await render({
      q: " fast ",
      city: " Lahore ",
      checkIn: "2026-12-01",
      checkOut: "2027-03-01",
      guests: "3",
      gender: "FEMALE",
      minPrice: "5000",
      maxPrice: "20000",
      amenities: ["wifi", "wifi", "meals"],
      verified: "true",
      sort: "rating",
      page: "2",
    });

    const requested = mocks.loadInitial.mock.calls[0][0];
    // The client builds its first request from these props (see SearchPageClient).
    const clientRequest = {
      query: props.initialQuery,
      city: props.initialCity,
      moveInDate: props.initialMoveInDate,
      checkOutDate: props.initialCheckOut,
      guests: String(props.initialGuests),
      nearby: props.initialNearby,
      filters: props.initialFilters,
      page: props.initialPage,
      initialNearbyCoordinates: props.initialNearbyCoordinates,
    };

    expect(hostelSearchRequestKey(requested)).toBe(hostelSearchRequestKey(clientRequest));
    expect(requested).toMatchObject({
      query: "fast",
      city: "Lahore",
      moveInDate: "2026-12-01",
      checkOutDate: "2027-03-01",
      guests: "3",
      page: 2,
      filters: { gender: "FEMALE", minPrice: "5000", maxPrice: "20000", amenities: ["wifi", "meals"], verified: true, sort: "rating" },
    });
  });

  it("marks nearby searches so the server leaves them to the browser", async () => {
    await render({ nearby: "true", latitude: "31.5", longitude: "74.3" });
    expect(mocks.loadInitial.mock.calls[0][0]).toMatchObject({
      nearby: true,
      initialNearbyCoordinates: { latitude: 31.5, longitude: 74.3 },
    });
  });
});
