import { describe, expect, it } from "vitest";
import { hostelCreateSchema } from "./index";

const listing = {
  name: "Campus Hostel",
  description: "A comfortable student hostel close to campus with secure access.",
  city: "Lahore",
  address: "123 Main Street, Lahore",
  pricePerMonth: 25_000,
  rooms: 99,
  capacity: 999,
  gender: "MIXED",
  cancellationPolicy: "STANDARD",
  minStay: 1,
  amenities: ["WiFi"],
  rules: [],
  roomTypes: [{
    name: "Standard room",
    pricePerMonth: 25_000,
    capacity: 2,
    facilities: ["Shared bathroom"],
    images: [],
  }],
};

describe("hostelCreateSchema room totals", () => {
  it("allows client totals that disagree with the rooms because the server derives totals", () => {
    expect(hostelCreateSchema.safeParse(listing).success).toBe(true);
  });

  it("does not add an undocumented aggregate capacity limit", () => {
    const result = hostelCreateSchema.safeParse({
      ...listing,
      roomTypes: Array.from({ length: 11 }, (_, index) => ({
        ...listing.roomTypes[0],
        name: `Room ${index + 1}`,
        capacity: 100,
      })),
    });

    expect(result.success).toBe(true);
  });
});
