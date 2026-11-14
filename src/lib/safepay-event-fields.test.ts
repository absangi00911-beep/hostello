import { describe, expect, it } from "vitest";
import {
  isSafepayBookingMethod,
  isValidPkrAmount,
  parseOrderId,
  parseTracker,
} from "@/lib/safepay-event-fields";
import { MAX_ORDER_ID_LENGTH, MAX_TRACKER_LENGTH, type SafepayEvent } from "@/lib/safepay-webhook-auth";

const withOrder = (order_id: unknown): SafepayEvent => ({ data: { metadata: { order_id } } });
const withTracker = (tracker: unknown): SafepayEvent => ({ data: { tracker } });
const withAmount = (amount: unknown, currency: unknown = "PKR"): SafepayEvent => ({ data: { amount, currency } });

describe("parseOrderId", () => {
  it("returns a non-empty string up to the length limit", () => {
    expect(parseOrderId(withOrder("order_1"))).toBe("order_1");
    expect(parseOrderId(withOrder("o".repeat(MAX_ORDER_ID_LENGTH)))).toHaveLength(MAX_ORDER_ID_LENGTH);
  });

  it("rejects missing, empty, non-string and over-long values", () => {
    for (const value of [undefined, null, "", 7, {}, ["a"], "o".repeat(MAX_ORDER_ID_LENGTH + 1)]) {
      expect(parseOrderId(withOrder(value)), String(value)).toBeNull();
    }
    expect(parseOrderId({})).toBeNull();
    expect(parseOrderId({ data: {} })).toBeNull();
  });
});

describe("parseTracker", () => {
  it("returns a non-empty string up to the length limit", () => {
    expect(parseTracker(withTracker("track_1"))).toBe("track_1");
    expect(parseTracker(withTracker("t".repeat(MAX_TRACKER_LENGTH)))).toHaveLength(MAX_TRACKER_LENGTH);
  });

  it("rejects missing, empty, non-string and over-long values", () => {
    for (const value of [undefined, null, "", 7, {}, "t".repeat(MAX_TRACKER_LENGTH + 1)]) {
      expect(parseTracker(withTracker(value)), String(value)).toBeNull();
    }
  });
});

describe("isSafepayBookingMethod", () => {
  it("settles through this webhook only for Safepay or legacy bookings without a method", () => {
    expect(isSafepayBookingMethod("safepay")).toBe(true);
    expect(isSafepayBookingMethod(null)).toBe(true);
  });

  it("refuses bookings assigned to another provider", () => {
    for (const method of ["jazzcash", "easypaisa", "cash", "", "SAFEPAY"]) {
      expect(isSafepayBookingMethod(method), method).toBe(false);
    }
  });
});

describe("isValidPkrAmount", () => {
  it("accepts exactly the expected integer amount in PKR", () => {
    expect(isValidPkrAmount(withAmount(150_000), 150_000)).toBe(true);
  });

  it("rejects a different amount, in either direction", () => {
    expect(isValidPkrAmount(withAmount(149_999), 150_000)).toBe(false);
    expect(isValidPkrAmount(withAmount(150_001), 150_000)).toBe(false);
  });

  it("rejects any other currency, or none", () => {
    for (const currency of ["USD", "pkr", "", undefined, null]) {
      expect(isValidPkrAmount(withAmount(150_000, currency)), String(currency)).toBe(false);
    }
  });

  it("rejects amounts that are not safe integers, including numeric strings", () => {
    for (const amount of ["150000", 150_000.5, NaN, Infinity, 2 ** 60, undefined, null]) {
      expect(isValidPkrAmount(withAmount(amount), 150_000), String(amount)).toBe(false);
    }
  });

  it("rejects an event with no data", () => {
    expect(isValidPkrAmount({}, 0)).toBe(false);
  });
});
