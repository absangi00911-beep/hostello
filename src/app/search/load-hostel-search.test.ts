import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NEARBY_COORDINATES_SESSION_KEY } from "@/lib/nearby-search";
import {
  PAGE_SIZE,
  buildHostelSearchQuery,
  hostelSearchRequestKey,
  loadHostelSearch,
  readNearbyCoordinates,
  shouldSkipHostelSearchLoad,
  type HostelSearchRequest,
} from "./load-hostel-search";

const fetchMock = vi.fn();
const getItem = vi.fn();

const hostel = (overrides: Record<string, unknown> = {}) => ({
  id: "h1",
  name: "Green View",
  city: "Lahore",
  area: "Gulberg",
  pricePerMonth: 12000,
  coverImage: null,
  images: [],
  rating: 4.5,
  reviewCount: 3,
  ...overrides,
});
const json = (body: unknown, ok = true) => ({ ok, json: async () => body });

const request = (overrides: Partial<HostelSearchRequest> = {}): HostelSearchRequest => ({
  query: "fast",
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

const signal = () => new AbortController().signal;

beforeEach(() => {
  fetchMock.mockReset();
  getItem.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("window", { sessionStorage: { getItem } });
});
afterEach(() => vi.unstubAllGlobals());

describe("loadHostelSearch: regular search", () => {
  it("requests /api/hostels with every applied filter and the page size", async () => {
    fetchMock.mockResolvedValue(json({ data: [hostel()], total: 1 }));
    const abort = signal();

    await loadHostelSearch(
      request({
        moveInDate: "2026-12-01",
        checkOutDate: "2027-03-01",
        guests: "2",
        page: 3,
        filters: { gender: "FEMALE", minPrice: "5000", maxPrice: "20000", amenities: ["wifi", "meals"], verified: true, sort: "rating" },
      }),
      abort,
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url.startsWith("/api/hostels?")).toBe(true);
    const params = new URL(url, "https://x.test").searchParams;
    expect(Object.fromEntries(params.entries())).toMatchObject({
      q: "fast",
      city: "Lahore",
      moveInDate: "2026-12-01",
      checkOut: "2027-03-01",
      guests: "2",
      gender: "FEMALE",
      minPrice: "5000",
      maxPrice: "20000",
      verified: "true",
      sort: "rating",
      page: "3",
      limit: String(PAGE_SIZE),
    });
    expect(params.getAll("amenities")).toEqual(["wifi", "meals"]);
    expect(init).toEqual({ signal: abort });
  });

  it("omits dates, guests and empty filters when they are not set", async () => {
    fetchMock.mockResolvedValue(json({ data: [], total: 0 }));
    await loadHostelSearch(request({ query: "", city: "" }), signal());

    const params = new URL(fetchMock.mock.calls[0][0], "https://x.test").searchParams;
    expect([...params.keys()].sort()).toEqual(["limit", "page", "sort"]);
  });

  it("returns the results and the total", async () => {
    fetchMock.mockResolvedValue(json({ data: [hostel(), hostel({ id: "h2" })], total: 45 }));
    expect(await loadHostelSearch(request(), signal())).toEqual({
      status: "ok",
      hostels: [hostel(), hostel({ id: "h2" })],
      total: 45,
    });
  });
});

describe("loadHostelSearch: nearby search", () => {
  const stored = JSON.stringify({ latitude: 31.5, longitude: 74.3 });

  it("POSTs the stored coordinates and, with dates, the stay details", async () => {
    getItem.mockReturnValue(stored);
    fetchMock.mockResolvedValue(json({ data: [], total: 0 }));
    const abort = signal();

    await loadHostelSearch(
      request({ nearby: true, city: "", moveInDate: "2026-12-01", checkOutDate: "2027-03-01", guests: "3" }),
      abort,
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url.startsWith("/api/hostels/nearby?")).toBe(true);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(init.signal).toBe(abort);
    expect(JSON.parse(init.body)).toEqual({
      latitude: 31.5,
      longitude: 74.3,
      moveInDate: "2026-12-01",
      checkOut: "2027-03-01",
      guests: 3,
    });
    expect(getItem).toHaveBeenCalledWith(NEARBY_COORDINATES_SESSION_KEY);
  });

  it("sends only the coordinates when no dates are chosen, and no check-out without a check-in", async () => {
    getItem.mockReturnValue(stored);
    fetchMock.mockResolvedValue(json({ data: [], total: 0 }));

    await loadHostelSearch(request({ nearby: true, guests: "4", checkOutDate: "2027-03-01" }), signal());

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ latitude: 31.5, longitude: 74.3 });
  });

  it("falls back to the coordinates from the server when this tab has none", async () => {
    getItem.mockReturnValue(null);
    fetchMock.mockResolvedValue(json({ data: [], total: 0 }));

    await loadHostelSearch(request({ nearby: true, initialNearbyCoordinates: { latitude: 24.8, longitude: 67 } }), signal());

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ latitude: 24.8, longitude: 67 });
  });

  it("explains that the location is gone, and makes no request, when there are no coordinates", async () => {
    getItem.mockReturnValue(null);

    expect(await loadHostelSearch(request({ nearby: true }), signal())).toEqual({
      status: "error",
      message: "Your nearby location is no longer available in this tab. Start a new search and choose Nearby again.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats a storage failure as a generic load error", async () => {
    getItem.mockImplementation(() => {
      throw new Error("storage blocked");
    });
    expect(await loadHostelSearch(request({ nearby: true }), signal())).toEqual({
      status: "error",
      message: "Unable to load hostels. Please try again.",
    });
  });
});

describe("loadHostelSearch: failures", () => {
  it("shows the server's error message when it sends one", async () => {
    fetchMock.mockResolvedValue(json({ error: "Too many requests." }, false));
    expect(await loadHostelSearch(request(), signal())).toEqual({ status: "error", message: "Too many requests." });
  });

  it("falls back to the generic message for an error response without a usable message", async () => {
    for (const body of [{}, null, "oops", { error: 500 }, []]) {
      fetchMock.mockResolvedValue(json(body, false));
      expect(await loadHostelSearch(request(), signal()), JSON.stringify(body)).toEqual({
        status: "error",
        message: "Unable to load hostels. Please try again.",
      });
    }
  });

  it("rejects a successful response whose shape is wrong", async () => {
    const bad = [
      {},
      { data: "x", total: 1 },
      { data: [hostel({ id: 7 })], total: 1 },
      { data: [hostel({ images: [1] })], total: 1 },
      { data: [hostel()], total: "1" },
      { data: [hostel()], total: 1.5 },
      { data: [hostel(), hostel()], total: 1 },
      null,
    ];
    for (const body of bad) {
      fetchMock.mockResolvedValue(json(body));
      expect((await loadHostelSearch(request(), signal())).status, JSON.stringify(body)).toBe("error");
    }
  });

  it("accepts nullable area and cover image, and an empty result", async () => {
    fetchMock.mockResolvedValue(json({ data: [hostel({ area: null, coverImage: "https://x/y.jpg" })], total: 1 }));
    expect((await loadHostelSearch(request(), signal())).status).toBe("ok");
    fetchMock.mockResolvedValue(json({ data: [], total: 0 }));
    expect((await loadHostelSearch(request(), signal())).status).toBe("ok");
  });

  it("reports a network failure or unreadable JSON as a generic error", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    expect((await loadHostelSearch(request(), signal())).status).toBe("error");

    fetchMock.mockResolvedValue({ ok: true, json: async () => { throw new SyntaxError("bad json"); } });
    expect(await loadHostelSearch(request(), signal())).toEqual({
      status: "error",
      message: "Unable to load hostels. Please try again.",
    });
  });

  it("reports an aborted request as aborted, not as an error", async () => {
    const abortError = Object.assign(new Error("aborted"), { name: "AbortError" });
    fetchMock.mockRejectedValue(abortError);
    expect(await loadHostelSearch(request(), signal())).toEqual({ status: "aborted" });
  });
});

describe("readNearbyCoordinates", () => {
  it("returns stored coordinates, else the fallback; invalid or unparsable data counts as none", () => {
    const fallback = { latitude: 1, longitude: 2 };
    getItem.mockReturnValue(JSON.stringify({ latitude: 31.5, longitude: 74.3 }));
    expect(readNearbyCoordinates(fallback)).toEqual({ latitude: 31.5, longitude: 74.3 });

    for (const raw of [null, "{not json", JSON.stringify({ latitude: 999, longitude: 0 }), JSON.stringify("x")]) {
      getItem.mockReturnValue(raw);
      expect(readNearbyCoordinates(fallback), String(raw)).toEqual(fallback);
    }
    getItem.mockReturnValue(null);
    expect(readNearbyCoordinates()).toBeNull();
  });
});

describe("buildHostelSearchQuery", () => {
  it("is the query string loadHostelSearch sends", async () => {
    fetchMock.mockResolvedValue(json({ data: [], total: 0 }));
    const search = request({ city: "Quetta", page: 2, filters: { gender: "MALE", minPrice: "100", maxPrice: "", amenities: ["wifi"], verified: true, sort: "price_desc" } });

    await loadHostelSearch(search, signal());

    expect(fetchMock.mock.calls[0][0]).toBe(`/api/hostels?${buildHostelSearchQuery(search)}`);
  });
});

describe("hostelSearchRequestKey", () => {
  it("is the same for the same search and different when anything that changes the answer differs", () => {
    expect(hostelSearchRequestKey(request())).toBe(hostelSearchRequestKey(request()));
    const variants: Partial<HostelSearchRequest>[] = [
      { query: "other" },
      { city: "Karachi" },
      { moveInDate: "2026-12-01" },
      { checkOutDate: "2027-01-01" },
      { guests: "2" },
      { nearby: true },
      { page: 2 },
      { filters: { ...request().filters, verified: true } },
      { filters: { ...request().filters, sort: "rating" } },
      { filters: { ...request().filters, amenities: ["wifi"] } },
    ];
    for (const variant of variants) {
      expect(hostelSearchRequestKey(request(variant)), JSON.stringify(variant)).not.toBe(hostelSearchRequestKey(request()));
    }
  });

  it("ignores the nearby coordinates", () => {
    expect(hostelSearchRequestKey(request({ initialNearbyCoordinates: { latitude: 1, longitude: 2 } }))).toBe(
      hostelSearchRequestKey(request()),
    );
  });
});

describe("shouldSkipHostelSearchLoad", () => {
  it("skips only when the results on screen answer exactly this search and this retry count", () => {
    expect(shouldSkipHostelSearchLoad({ key: "a", reload: 0 }, "a", 0)).toBe(true);
    expect(shouldSkipHostelSearchLoad({ key: "a", reload: 0 }, "b", 0)).toBe(false);
    expect(shouldSkipHostelSearchLoad({ key: "a", reload: 0 }, "a", 1)).toBe(false);
    expect(shouldSkipHostelSearchLoad(null, "a", 0)).toBe(false);
  });
});
