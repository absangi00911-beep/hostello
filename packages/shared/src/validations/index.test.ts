import { describe, expect, it } from "vitest";
import { bookingSchema, hostelCreateSchema, searchParamsSchema } from "./index";

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

  describe("bookingSchema payment methods", () => {
    const booking = {
      hostelId: "clh1234567890123456789012",
      roomId: "room-1",
      checkIn: "2099-01-01",
      checkOut: "2099-02-01",
      guests: 1,
    };

    it("accepts the enabled Safepay method", () => {
      expect(bookingSchema.safeParse({ ...booking, paymentMethod: "safepay" }).success).toBe(true);
    });

    it.each(["jazzcash", "easypaisa"])("rejects disabled payment method %s", (paymentMethod) => {
      expect(bookingSchema.safeParse({ ...booking, paymentMethod }).success).toBe(false);
    });
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

describe("searchParamsSchema", () => {
  it('treats verified="false" as false, not true', () => {
    expect(searchParamsSchema.parse({ verified: "false" }).verified).toBe(false);
    expect(searchParamsSchema.parse({ verified: "true" }).verified).toBe(true);
    expect(searchParamsSchema.parse({}).verified).toBeUndefined();
  });

  it("rejects values that are not exactly true or false", () => {
    expect(searchParamsSchema.safeParse({ verified: "0" }).success).toBe(false);
    expect(searchParamsSchema.safeParse({ verified: "yes" }).success).toBe(false);
  });

  it("rejects non-finite or negative prices", () => {
    expect(searchParamsSchema.safeParse({ minPrice: "Infinity" }).success).toBe(false);
    expect(searchParamsSchema.safeParse({ maxPrice: "-5" }).success).toBe(false);
    expect(searchParamsSchema.safeParse({ minPrice: "5000", maxPrice: "20000" }).success).toBe(true);
  });
});
