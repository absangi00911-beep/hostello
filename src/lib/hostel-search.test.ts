// Path: src/lib/hostel-search.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
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
import { searchHostels } from "@/lib/typesense";
import { db } from "@/lib/db";

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

  it("returns empty hostelIds when Typesense has no hits", async () => {
    vi.mocked(searchHostels).mockResolvedValue(typesenseResult([], 0) as any);

    const result = await searchHostelsWithFallback(baseParams());

    expect(result.hostelIds).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.isSearchDegraded).toBe(false);
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