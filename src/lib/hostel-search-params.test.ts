import { describe, expect, it } from "vitest";
import { parseHostelSearchParams } from "@/lib/hostel-search-params";

const parse = (query: string) => parseHostelSearchParams(new URLSearchParams(query));
const search = (query: string) => {
  const result = parse(query);
  if (!result.ok) throw new Error(`expected ok, got: ${result.error}`);
  return result.search;
};
const error = (query: string) => {
  const result = parse(query);
  if (result.ok) throw new Error("expected an error");
  return result;
};

describe("parseHostelSearchParams: valid searches", () => {
  it("defaults: newest first, page 1, 20 per page, nothing filtered", () => {
    expect(search("")).toEqual({
      q: undefined,
      city: undefined,
      gender: undefined,
      verified: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      amenities: undefined,
      moveInDate: undefined,
      checkOut: undefined,
      guests: undefined,
      sort: "newest",
      page: 1,
      limit: 20,
    });
  });

  it("reads every filter", () => {
    const parsed = search(
      "q=fast&city=Lahore&gender=FEMALE&verified=true&minPrice=5000&maxPrice=20000&amenities=wifi&amenities=meals&sort=price_asc&page=3&limit=10",
    );
    expect(parsed).toMatchObject({
      q: "fast",
      city: "Lahore",
      gender: "FEMALE",
      verified: true,
      minPrice: 5000,
      maxPrice: 20000,
      amenities: ["wifi", "meals"],
      sort: "price_asc",
      page: 3,
      limit: 10,
    });
  });

  it("ignores unknown genders and sorts instead of failing", () => {
    expect(search("gender=ROBOT&sort=bogus")).toMatchObject({ gender: undefined, sort: "newest" });
  });

  it("reads a stay from moveInDate or checkIn, defaulting guests to 1 only when dates are given", () => {
    const stay = search("moveInDate=2026-12-01&checkOut=2027-03-01");
    expect(stay.moveInDate?.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(stay.checkOut?.toISOString()).toBe("2027-03-01T00:00:00.000Z");
    expect(stay.guests).toBe(1);
    expect(search("checkIn=2026-12-01&checkOut=2027-03-01&guests=3").guests).toBe(3);
    expect(search("moveInDate=2026-12-01").checkOut).toBeUndefined();
  });
});

describe("parseHostelSearchParams: rejected searches", () => {
  it("rejects over-long text filters and too many amenities", () => {
    for (const query of [
      `q=${"a".repeat(201)}`,
      `city=${"a".repeat(101)}`,
      "amenities=" + "a".repeat(101),
      Array.from({ length: 31 }, (_, i) => `amenities=a${i}`).join("&"),
    ]) {
      expect(error(query), query.slice(0, 40)).toEqual({
        ok: false,
        error: "One or more search filters are too long.",
        status: 400,
      });
    }
  });

  it("rejects a repeated or non-true verified flag", () => {
    expect(error("verified=false").error).toMatch(/too long/);
    expect(error("verified=true&verified=true").error).toMatch(/too long/);
  });

  it("rejects malformed, impossible or contradictory dates and guest counts", () => {
    for (const query of [
      "moveInDate=2026-13-45",
      "moveInDate=12/01/2026",
      "moveInDate=2026-12-01&checkOut=2026-12-01",
      "moveInDate=2026-12-01&checkOut=2026-11-01",
      "checkOut=2027-03-01",
      "checkIn=2026-12-01",
      "checkIn=2026-12-01&moveInDate=2026-12-01&checkOut=2027-01-01",
      "moveInDate=2026-12-01&moveInDate=2026-12-02",
      "moveInDate=2026-12-01&checkOut=2027-03-01&guests=0",
      "moveInDate=2026-12-01&checkOut=2027-03-01&guests=9",
      "moveInDate=2026-12-01&checkOut=2027-03-01&guests=1.5",
      "guests=2",
    ]) {
      expect(error(query), query).toEqual({
        ok: false,
        error: "Move-in date or guest count is invalid.",
        status: 400,
      });
    }
  });

  it("rejects negative or non-numeric prices", () => {
    for (const query of ["minPrice=-1", "maxPrice=abc", "minPrice=Infinity"]) {
      expect(error(query).error, query).toBe("Price filters must be non-negative numbers.");
    }
  });
});
