import { describe, expect, it } from "vitest";
import {
  buildHostelAvailabilityAlertHref,
  buildSearchAvailabilityAlertHref,
} from "@/lib/availability-alert-links";

describe("availability alert entry links", () => {
  it("prefills only the supported search filters and stay details provided by results", () => {
    const href = buildSearchAvailabilityAlertHref({
      city: "Lahore",
      gender: "FEMALE",
      minPrice: 10_000,
      maxPrice: 20_000,
      amenities: ["wifi", "laundry"],
      checkIn: "2030-03-20",
      guests: 2,
    });
    const query = new URLSearchParams(href.split("?")[1]);

    expect(href.startsWith("/student/availability-alerts?")).toBe(true);
    expect(query.get("type")).toBe("SEARCH");
    expect(query.get("city")).toBe("Lahore");
    expect(query.get("gender")).toBe("FEMALE");
    expect(query.get("minPrice")).toBe("10000");
    expect(query.get("maxPrice")).toBe("20000");
    expect(query.getAll("amenities")).toEqual(["laundry", "wifi"]);
    expect(query.get("checkIn")).toBe("2030-03-20");
    expect(query.get("guests")).toBe("2");
    expect(query.has("nearby")).toBe(false);
    expect(query.has("sort")).toBe(false);
    expect(query.has("page")).toBe(false);
    expect(query.has("limit")).toBe(false);
  });

  it("includes nearby coordinates only when the caller supplied a valid location", () => {
    const withoutLocation = new URLSearchParams(
      buildSearchAvailabilityAlertHref({ nearby: null }).split("?")[1],
    );
    const withLocation = new URLSearchParams(
      buildSearchAvailabilityAlertHref({
        nearby: { latitude: 31.52, longitude: 74.36 },
      }).split("?")[1],
    );

    expect(withoutLocation.has("latitude")).toBe(false);
    expect(withLocation.get("latitude")).toBe("31.52");
    expect(withLocation.get("longitude")).toBe("74.36");
  });

  it("prefills the hostel identity and valid selected stay", () => {
    const query = new URLSearchParams(
      buildHostelAvailabilityAlertHref({
        hostelId: "hostel_1",
        checkIn: "2030-03-20",
        checkOut: "2030-03-22",
        guests: 3,
      }).split("?")[1],
    );

    expect(query.get("type")).toBe("HOSTEL");
    expect(query.get("hostelId")).toBe("hostel_1");
    expect(query.get("checkIn")).toBe("2030-03-20");
    expect(query.get("checkOut")).toBe("2030-03-22");
    expect(query.get("guests")).toBe("3");
  });
});
