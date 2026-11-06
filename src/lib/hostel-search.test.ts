// Path: src/lib/hostel-search.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: vi.fn(),
    hostel: {
      findMany: vi.fn(),
      count:    vi.fn(),
    },
  },
}));

vi.mock("@/lib/typesense", () => ({
  searchHostels: vi.fn(),
}));

import { searchHostelsWithFallback, type SearchParams } from "./hostel-search";
import { searchHostels } from "../lib/typesense";
import { db } from "../lib/db";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const IDS = ["id_1", "id_2", "id_3"];

/** A minimal Typesense result with the given IDs. */
function typesenseResult(ids: string[], total = ids.length) {
  return {
    found: total,
    hits:  ids.map((id) => ({ document: { id } })),
  };
}

/** Base search params — page 1, 20 per page. */
function baseParams(overrides: Partial<SearchParams> = {}): SearchParams {
  return { page: 1, limit: 20, ...overrides };
}

// ═════════════════════════════════════════════════════════════════════════════
// TYPESENSE SUCCESS PATH
// ═════════════════════════════════════════════════════════════════════════════

describe("Typesense success path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchHostels).mockResolvedValue(typesenseResult(IDS, 42) as any);
  });

  it("returns hostelIds and total from Typesense", async () => {
    const result = await searchHostelsWithFallback(baseParams());

    expect(result.hostelIds).toEqual(IDS);
    expect(result.total).toBe(42);
    expect(result.isSearchDegraded).toBe(false);
  });

  it("does NOT call Prisma when Typesense succeeds", async () => {
    await searchHostelsWithFallback(baseParams());

    expect(db.hostel.findMany).not.toHaveBeenCalled();
    expect(db.hostel.count).not.toHaveBeenCalled();
  });

  it("passes query string to Typesense", async () => {
    await searchHostelsWithFallback(baseParams({ q: "near UET" }));

    expect(searchHostels).toHaveBeenCalledWith("near UET", expect.any(Object));
  });

  it("passes empty string when q is undefined", async () => {
    await searchHostelsWithFallback(baseParams());

    expect(searchHostels).toHaveBeenCalledWith("", expect.any(Object));
  });

  it("passes city filter to Typesense", async () => {
    await searchHostelsWithFallback(baseParams({ city: "Lahore" }));

    expect(searchHostels).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ city: "Lahore" }),
    );
  });

  it("passes gender filter to Typesense", async () => {
    await searchHostelsWithFallback(baseParams({ gender: "FEMALE" }));

    expect(searchHostels).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ gender: "FEMALE" }),
    );
  });

  it("passes price range to Typesense", async () => {
    await searchHostelsWithFallback(baseParams({ minPrice: 5000, maxPrice: 12000 }));

    expect(searchHostels).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ minPrice: 5000, maxPrice: 12000 }),
    );
  });

  it("passes amenities array to Typesense", async () => {
    await searchHostelsWithFallback(baseParams({ amenities: ["WiFi", "AC"] }));

    expect(searchHostels).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ amenities: ["WiFi", "AC"] }),
    );
  });

  it("passes verified flag to Typesense", async () => {
    await searchHostelsWithFallback(baseParams({ verified: true }));

    expect(searchHostels).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ verified: true }),
    );
  });

  it("defaults sort to 'newest' when not specified", async () => {
    await searchHostelsWithFallback(baseParams());

    expect(searchHostels).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ sort: "newest" }),
    );
  });

  it("passes explicit sort to Typesense", async () => {
    await searchHostelsWithFallback(baseParams({ sort: "rating" }));

    expect(searchHostels).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ sort: "rating" }),
    );
  });

  it("falls back to Prisma when Typesense has no hits", async () => {
    vi.mocked(searchHostels).mockResolvedValue(typesenseResult([], 0) as any);
    vi.mocked(db.hostel.findMany).mockResolvedValue([
      { id: "db_hostel_1" },
    ] as any);
    vi.mocked(db.hostel.count).mockResolvedValue(1);

    const result = await searchHostelsWithFallback(baseParams());

    expect(result.hostelIds).toEqual(["db_hostel_1"]);
    expect(result.total).toBe(1);
    expect(result.isSearchDegraded).toBe(true);
  });
});

describe("move-in date availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps listings with enough spaces on the selected date and paginates after filtering", async () => {
    const moveInDate = new Date("2030-06-15T00:00:00.000Z");
    vi.mocked(db.hostel.findMany).mockResolvedValue([
      {
        id: "available",
        capacity: 5,
        bookings: [{ guests: 3 }],
        blockedDates: [],
      },
      {
        id: "full",
        capacity: 3,
        bookings: [{ guests: 3 }],
        blockedDates: [],
      },
      {
        id: "blocked",
        capacity: 8,
        bookings: [],
        blockedDates: [{ id: "blocked-date" }],
      },
      {
        id: "second-available",
        capacity: 4,
        bookings: [{ guests: 1 }],
        blockedDates: [],
      },
    ] as never);

    const result = await searchHostelsWithFallback(
      baseParams({ moveInDate, guests: 2, page: 2, limit: 1 }),
    );

    expect(result).toEqual({
      hostelIds: ["second-available"],
      total: 2,
      isSearchDegraded: false,
    });
    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "ACTIVE" },
        select: expect.objectContaining({
          capacity: true,
          bookings: {
            where: {
              status: { in: ["PENDING", "CONFIRMED"] },
              checkIn: { lte: moveInDate },
              checkOut: { gt: moveInDate },
            },
            select: { guests: true },
          },
          blockedDates: {
            where: {
              startDate: { lte: moveInDate },
              endDate: { gte: moveInDate },
            },
            select: { id: true },
          },
        }),
      }),
    );
    expect(searchHostels).not.toHaveBeenCalled();
  });

  it("does not apply availability when the move-in date is omitted", async () => {
    vi.mocked(searchHostels).mockResolvedValue(typesenseResult(IDS) as any);

    const result = await searchHostelsWithFallback(baseParams({ guests: 4 }));

    expect(result.hostelIds).toEqual(IDS);
    expect(searchHostels).toHaveBeenCalledOnce();
    expect(db.hostel.findMany).not.toHaveBeenCalled();
  });
});

describe("exact stay availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses seat holds across the full stay before paginating results", async () => {
    const checkIn = new Date("2030-06-15T00:00:00.000Z");
    const checkOut = new Date("2030-06-20T00:00:00.000Z");
    vi.mocked(db.hostel.findMany).mockResolvedValue([
      { id: "available", latitude: null, longitude: null },
      { id: "held-during-stay", latitude: null, longitude: null },
    ] as never);
    const tx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      hostel: {
        findMany: vi.fn().mockResolvedValue([
          { id: "available", latitude: null, longitude: null },
          { id: "held-during-stay", latitude: null, longitude: null },
        ]),
      },
      room: {
        findMany: vi.fn().mockResolvedValue([
          { id: "room-available", hostelId: "available", capacity: 2 },
          { id: "room-held", hostelId: "held-during-stay", capacity: 2 },
        ]),
      },
      seatHold: {
        findMany: vi.fn().mockResolvedValue([
          {
            roomId: "room-held",
            seatNo: 1,
          },
          {
            roomId: "room-held",
            seatNo: 2,
          },
        ]),
      },
      blockedDate: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    vi.mocked(db.$transaction).mockImplementation(
      async (callback: any) => callback(tx),
    );

    const result = await searchHostelsWithFallback(
      baseParams({ moveInDate: checkIn, checkOut, guests: 2, limit: 1 }),
    );

    expect(result).toEqual({
      hostelIds: ["available"],
      total: 1,
      isSearchDegraded: false,
    });
    expect(tx.seatHold.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          checkIn: { lt: checkOut },
          checkOut: { gt: checkIn },
        }),
      }),
    );
    expect(searchHostels).not.toHaveBeenCalled();
  });
});

describe("nearby search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters by the 25 km radius before paginating and excludes unlocated hostels", async () => {
    vi.mocked(db.hostel.findMany).mockResolvedValue([
      { id: "nearby", latitude: 33.77, longitude: 73.0479 },
      { id: "outside-radius", latitude: 33.96, longitude: 73.0479 },
      { id: "missing-coordinates", latitude: null, longitude: null },
    ] as never);

    const result = await searchHostelsWithFallback(
      baseParams({
        nearby: { latitude: 33.6844, longitude: 73.0479 },
        page: 1,
        limit: 1,
      }),
    );

    expect(result).toEqual({
      hostelIds: ["nearby"],
      total: 1,
      isSearchDegraded: false,
    });
    expect(searchHostels).not.toHaveBeenCalled();
    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "ACTIVE",
          latitude: expect.objectContaining({ gte: expect.any(Number), lte: expect.any(Number) }),
        }),
        select: expect.objectContaining({
          id: true,
          latitude: true,
          longitude: true,
        }),
      }),
    );
  });

  it("applies selected-day availability inside the nearby radius before pagination", async () => {
    const moveInDate = new Date("2030-06-15T00:00:00.000Z");
    vi.mocked(db.hostel.findMany).mockResolvedValue([
      {
        id: "available",
        latitude: 33.77,
        longitude: 73.0479,
        capacity: 4,
        bookings: [{ guests: 1 }],
        blockedDates: [],
      },
      {
        id: "full",
        latitude: 33.76,
        longitude: 73.0479,
        capacity: 2,
        bookings: [{ guests: 2 }],
        blockedDates: [],
      },
      {
        id: "blocked",
        latitude: 33.75,
        longitude: 73.0479,
        capacity: 8,
        bookings: [],
        blockedDates: [{ id: "blocked-date" }],
      },
      {
        id: "outside-radius",
        latitude: 33.96,
        longitude: 73.0479,
        capacity: 8,
        bookings: [],
        blockedDates: [],
      },
    ] as never);

    const result = await searchHostelsWithFallback(
      baseParams({
        nearby: { latitude: 33.6844, longitude: 73.0479 },
        moveInDate,
        guests: 2,
      }),
    );

    expect(result).toEqual({
      hostelIds: ["available"],
      total: 1,
      isSearchDegraded: false,
    });
    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          bookings: {
            where: {
              status: { in: ["PENDING", "CONFIRMED"] },
              checkIn: { lte: moveInDate },
              checkOut: { gt: moveInDate },
            },
            select: { guests: true },
          },
        }),
      }),
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// TYPESENSE FAILURE → PRISMA FALLBACK
// ═════════════════════════════════════════════════════════════════════════════

describe("Prisma fallback — triggered on any Typesense error", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchHostels).mockRejectedValue(new Error("Typesense connection refused"));
    vi.mocked(db.hostel.findMany).mockResolvedValue(IDS.map((id) => ({ id })) as any);
    vi.mocked(db.hostel.count).mockResolvedValue(IDS.length);
  });

  it("sets isSearchDegraded to true", async () => {
    const result = await searchHostelsWithFallback(baseParams());

    expect(result.isSearchDegraded).toBe(true);
  });

  it("returns hostelIds from Prisma", async () => {
    const result = await searchHostelsWithFallback(baseParams());

    expect(result.hostelIds).toEqual(IDS);
  });

  it("returns count from Prisma", async () => {
    vi.mocked(db.hostel.count).mockResolvedValue(99);

    const result = await searchHostelsWithFallback(baseParams());

    expect(result.total).toBe(99);
  });

  it("emits a correlated degradation event without recording search text", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const context = { request_id: "search-request-1", trace_id: "a".repeat(32) };

    await searchHostelsWithFallback(baseParams({ q: "private search text" }), context);

    const event = warn.mock.calls
      .map(([line]) => JSON.parse(String(line)))
      .find((record) => record.event === "search.degraded");
    expect(event).toMatchObject({
      request_id: "search-request-1",
      trace_id: "a".repeat(32),
      attributes: {
        degradation_reason: "typesense_error",
        result_count: IDS.length,
        provider_error_name: "Error",
      },
    });
    expect(JSON.stringify(event)).not.toContain("private search text");
    expect(JSON.stringify(event)).not.toContain("connection refused");
    warn.mockRestore();
  });

  it("does not alert on a valid no-results query when database fallback is also empty", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(searchHostels).mockResolvedValue(typesenseResult([], 0) as any);
    vi.mocked(db.hostel.findMany).mockResolvedValue([]);
    vi.mocked(db.hostel.count).mockResolvedValue(0);

    const result = await searchHostelsWithFallback(baseParams({ q: "no matching hostel" }));

    expect(result).toMatchObject({ hostelIds: [], total: 0, isSearchDegraded: true });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("always filters by status: ACTIVE in fallback", async () => {
    await searchHostelsWithFallback(baseParams());

    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "ACTIVE" }),
      }),
    );
  });

  it("triggers for timeout errors too", async () => {
    vi.mocked(searchHostels).mockRejectedValue(new Error("ETIMEDOUT"));

    const result = await searchHostelsWithFallback(baseParams());

    expect(result.isSearchDegraded).toBe(true);
    expect(db.hostel.findMany).toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PRISMA FALLBACK — FILTER COMBINATIONS
// ═════════════════════════════════════════════════════════════════════════════

describe("Prisma fallback — filter combinations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchHostels).mockRejectedValue(new Error("ts down"));
    vi.mocked(db.hostel.findMany).mockResolvedValue([]);
    vi.mocked(db.hostel.count).mockResolvedValue(0);
  });

  it("filters by city", async () => {
    await searchHostelsWithFallback(baseParams({ city: "Karachi" }));

    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ city: "Karachi" }),
      }),
    );
  });

  it("filters by gender", async () => {
    await searchHostelsWithFallback(baseParams({ gender: "MALE" }));

    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ gender: "MALE" }),
      }),
    );
  });

  it("filters by verified: true", async () => {
    await searchHostelsWithFallback(baseParams({ verified: true }));

    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ verified: true }),
      }),
    );
  });

  it("does NOT add verified to where when verified is false", async () => {
    await searchHostelsWithFallback(baseParams({ verified: false }));

    const call = vi.mocked(db.hostel.findMany).mock.calls[0][0] as any;
    expect(call.where).not.toHaveProperty("verified");
  });

  it("filters by minPrice only", async () => {
    await searchHostelsWithFallback(baseParams({ minPrice: 5000 }));

    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          pricePerMonth: { gte: 5000 },
        }),
      }),
    );
  });

  it("filters by maxPrice only", async () => {
    await searchHostelsWithFallback(baseParams({ maxPrice: 15000 }));

    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          pricePerMonth: { lte: 15000 },
        }),
      }),
    );
  });

  it("filters by both minPrice and maxPrice", async () => {
    await searchHostelsWithFallback(baseParams({ minPrice: 5000, maxPrice: 15000 }));

    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          pricePerMonth: { gte: 5000, lte: 15000 },
        }),
      }),
    );
  });

  it("does NOT add pricePerMonth when neither min nor max provided", async () => {
    await searchHostelsWithFallback(baseParams());

    const call = vi.mocked(db.hostel.findMany).mock.calls[0][0] as any;
    expect(call.where).not.toHaveProperty("pricePerMonth");
  });

  it("filters by amenities using hasEvery (all must match)", async () => {
    await searchHostelsWithFallback(baseParams({ amenities: ["WiFi", "AC", "Geyser"] }));

    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          amenities: { hasEvery: ["WiFi", "AC", "Geyser"] },
        }),
      }),
    );
  });

  it("does NOT add amenities filter when array is empty", async () => {
    await searchHostelsWithFallback(baseParams({ amenities: [] }));

    const call = vi.mocked(db.hostel.findMany).mock.calls[0][0] as any;
    expect(call.where).not.toHaveProperty("amenities");
  });

  it("combines all filters simultaneously", async () => {
    await searchHostelsWithFallback(
      baseParams({
        city:      "Islamabad",
        gender:    "MIXED",
        minPrice:  6000,
        maxPrice:  14000,
        amenities: ["Laundry"],
        verified:  true,
      }),
    );

    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status:        "ACTIVE",
          city:          "Islamabad",
          gender:        "MIXED",
          verified:      true,
          pricePerMonth: { gte: 6000, lte: 14000 },
          amenities:     { hasEvery: ["Laundry"] },
        }),
      }),
    );
  });

  it("uses the same where clause for findMany and count", async () => {
    await searchHostelsWithFallback(baseParams({ city: "Multan", gender: "FEMALE" }));

    const findCall  = vi.mocked(db.hostel.findMany).mock.calls[0][0] as any;
    const countCall = vi.mocked(db.hostel.count).mock.calls[0][0] as any;
    expect(findCall.where).toEqual(countCall.where);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PRISMA FALLBACK — SORT ORDERS
// ═════════════════════════════════════════════════════════════════════════════

describe("Prisma fallback — sort orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchHostels).mockRejectedValue(new Error("ts down"));
    vi.mocked(db.hostel.findMany).mockResolvedValue([]);
    vi.mocked(db.hostel.count).mockResolvedValue(0);
  });

  it("sorts by createdAt desc when sort is 'newest'", async () => {
    await searchHostelsWithFallback(baseParams({ sort: "newest" }));

    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } }),
    );
  });

  it("sorts by createdAt desc when sort is undefined (default)", async () => {
    await searchHostelsWithFallback(baseParams());

    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } }),
    );
  });

  it("sorts by pricePerMonth asc when sort is 'price_asc'", async () => {
    await searchHostelsWithFallback(baseParams({ sort: "price_asc" }));

    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { pricePerMonth: "asc" } }),
    );
  });

  it("sorts by pricePerMonth desc when sort is 'price_desc'", async () => {
    await searchHostelsWithFallback(baseParams({ sort: "price_desc" }));

    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { pricePerMonth: "desc" } }),
    );
  });

  it("sorts by rating desc when sort is 'rating'", async () => {
    await searchHostelsWithFallback(baseParams({ sort: "rating" }));

    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { rating: "desc" } }),
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PRISMA FALLBACK — PAGINATION
// ═════════════════════════════════════════════════════════════════════════════

describe("Prisma fallback — pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchHostels).mockRejectedValue(new Error("ts down"));
    vi.mocked(db.hostel.findMany).mockResolvedValue([]);
    vi.mocked(db.hostel.count).mockResolvedValue(0);
  });

  it("skips 0 records on page 1", async () => {
    await searchHostelsWithFallback(baseParams({ page: 1, limit: 20 }));

    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 }),
    );
  });

  it("skips 20 records on page 2 with limit 20", async () => {
    await searchHostelsWithFallback(baseParams({ page: 2, limit: 20 }));

    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 }),
    );
  });

  it("skips correctly for non-default limit", async () => {
    await searchHostelsWithFallback(baseParams({ page: 3, limit: 10 }));

    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    );
  });

  it("selects only id from Prisma (no over-fetching)", async () => {
    await searchHostelsWithFallback(baseParams());

    expect(db.hostel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ select: { id: true } }),
    );
  });
});
