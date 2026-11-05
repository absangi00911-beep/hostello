import { describe, expect, it } from "vitest";
import { AMENITIES } from "@hostello/shared";
import {
  normalizeSearchAlertCriteria,
  normalizeAvailabilityAlertStay,
} from "@/lib/availability-alert-criteria";

const today = new Date("2030-03-10T00:00:00.000Z");
const amenity = AMENITIES[0]!.id;

describe("availability alert criteria", () => {
  it("keeps only canonical search filters and normalizes their values", () => {
    expect(
      normalizeSearchAlertCriteria({
        q: "  quiet rooms ",
        city: " Lahore ",
        gender: "FEMALE",
        minPrice: 10_000,
        maxPrice: 20_000,
        amenities: [amenity, amenity],
        verified: true,
        sort: "price_asc",
        page: 5,
        limit: 20,
      }),
    ).toEqual({
      q: "quiet rooms",
      city: "Lahore",
      gender: "FEMALE",
      minPrice: 10_000,
      maxPrice: 20_000,
      amenities: [amenity],
      verified: true,
    });
  });

  it("retains nearby coordinates only when explicitly present in criteria", () => {
    expect(
      normalizeSearchAlertCriteria({
        nearby: { latitude: 31.52, longitude: 74.36 },
      }),
    ).toEqual({ nearby: { latitude: 31.52, longitude: 74.36 } });
    expect(normalizeSearchAlertCriteria({})).toEqual({});
  });

  it("rejects malformed or out-of-range search filters", () => {
    expect(() => normalizeSearchAlertCriteria({ minPrice: -1 })).toThrow();
    expect(() =>
      normalizeSearchAlertCriteria({ minPrice: 20_000, maxPrice: 10_000 }),
    ).toThrow();
    expect(() => normalizeSearchAlertCriteria({ amenities: ["not-a-public-filter"] })).toThrow();
    expect(() =>
      normalizeSearchAlertCriteria({ nearby: { latitude: 91, longitude: 0 } }),
    ).toThrow();
  });

  it("accepts valid future calendar dates and the booking guest limit", () => {
    expect(
      normalizeAvailabilityAlertStay(
        { checkIn: "2030-03-11", checkOut: "2030-03-13", guests: 4 },
        today,
      ),
    ).toEqual({
      checkIn: new Date("2030-03-11T00:00:00.000Z"),
      checkOut: new Date("2030-03-13T00:00:00.000Z"),
      guests: 4,
    });
  });

  it.each([
    ["invalid calendar date", "2030-02-30", "2030-03-02", 1],
    ["check-in today", "2030-03-10", "2030-03-12", 1],
    ["reversed date range", "2030-03-13", "2030-03-12", 1],
    ["too many guests", "2030-03-11", "2030-03-12", 5],
    ["zero guests", "2030-03-11", "2030-03-12", 0],
  ])("rejects %s", (_description, checkIn, checkOut, guests) => {
    expect(() =>
      normalizeAvailabilityAlertStay({ checkIn, checkOut, guests }, today),
    ).toThrow();
  });
});
