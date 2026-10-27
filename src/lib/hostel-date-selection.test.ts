import { describe, expect, it } from "vitest";
import { isStayWithinBounds } from "./hostel-date-selection";

describe("isStayWithinBounds", () => {
  it("accepts a stay that meets the minimum month count", () => {
    expect(
      isStayWithinBounds("2026-06-01", "2026-07-01", 1, null),
    ).toBe(true);
  });

  it("rejects a stay shorter than the minimum month count", () => {
    expect(
      isStayWithinBounds("2026-06-01", "2026-07-01", 2, null),
    ).toBe(false);
  });

  it("rejects a stay longer than the maximum month count", () => {
    expect(
      isStayWithinBounds("2026-06-01", "2026-08-01", 1, 1),
    ).toBe(false);
  });

  it("rejects missing, reversed, or invalid date values", () => {
    expect(isStayWithinBounds("", "2026-07-01", 1, null)).toBe(false);
    expect(
      isStayWithinBounds("2026-07-01", "2026-06-01", 1, null),
    ).toBe(false);
    expect(
      isStayWithinBounds("2026-02-30", "2026-03-30", 1, null),
    ).toBe(false);
  });
});
