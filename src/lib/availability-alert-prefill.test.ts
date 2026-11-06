import { describe, expect, it } from "vitest";
import {
  buildAvailabilityAlertDestination,
  parseAvailabilityAlertPrefill,
} from "@/lib/availability-alert-prefill";

describe("availability alert route prefill", () => {
  it("keeps only canonical public search filters and excludes result controls", () => {
    const initial = parseAvailabilityAlertPrefill(
      new URLSearchParams(
        "type=SEARCH&q=campus&city=Lahore&gender=FEMALE&minPrice=10000&maxPrice=20000&amenities=wifi&sort=price_asc&page=5&limit=2",
      ),
    );

    expect(initial).toEqual({
      type: "SEARCH",
      criteria: {
        q: "campus",
        city: "Lahore",
        gender: "FEMALE",
        minPrice: 10_000,
        maxPrice: 20_000,
        amenities: ["wifi"],
      },
    });
    expect(buildAvailabilityAlertDestination(initial)).toContain("type=SEARCH");
    expect(buildAvailabilityAlertDestination(initial)).not.toMatch(/sort|page|limit/);
  });

  it("does not infer nearby location without a complete explicit coordinate pair", () => {
    const missingCoordinates = parseAvailabilityAlertPrefill(
      new URLSearchParams("type=SEARCH&city="),
    );
    const partialCoordinates = parseAvailabilityAlertPrefill(
      new URLSearchParams("type=SEARCH&latitude=31.52"),
    );

    expect(missingCoordinates).toEqual({ type: "SEARCH" });
    expect(partialCoordinates).toEqual({ type: "SEARCH" });
  });

  it("preserves explicitly supplied nearby coordinates and valid hostel stay details", () => {
    const nearby = parseAvailabilityAlertPrefill(
      new URLSearchParams("type=SEARCH&latitude=31.52&longitude=74.36"),
    );
    const hostel = parseAvailabilityAlertPrefill(
      new URLSearchParams(
        "type=HOSTEL&hostelId=hostel_1&checkIn=2030-03-20&checkOut=2030-03-22&guests=3",
      ),
    );

    expect(nearby).toEqual({
      type: "SEARCH",
      criteria: { nearby: { latitude: 31.52, longitude: 74.36 } },
    });
    expect(hostel).toEqual({
      type: "HOSTEL",
      hostelId: "hostel_1",
      checkIn: "2030-03-20",
      checkOut: "2030-03-22",
      guests: 3,
    });
  });

  it("rejects malformed type and hostel identifiers", () => {
    expect(parseAvailabilityAlertPrefill(new URLSearchParams("type=PRICE"))).toBeNull();
    expect(
      parseAvailabilityAlertPrefill(
        new URLSearchParams("type=HOSTEL&hostelId=%2Fhostels%2Fother"),
      ),
    ).toBeNull();
  });
});
