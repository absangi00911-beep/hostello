import { describe, expect, it } from "vitest";
import {
  areStayBoundsValid,
  getEffectiveMaxStay,
  getWholeMonthTerm,
  isStayWithinBounds,
} from "./hostel-date-selection";

describe("whole-month hostel date selection", () => {
  it("accepts exact calendar-month terms and rejects partial months", () => {
    expect(isStayWithinBounds("2026-06-01", "2026-07-01", 1, null)).toBe(true);
    expect(isStayWithinBounds("2026-06-01", "2026-08-01", 2, null)).toBe(true);
    expect(isStayWithinBounds("2026-06-01", "2026-07-02", 1, null)).toBe(false);
    expect(isStayWithinBounds("2026-06-15", "2026-07-14", 1, null)).toBe(false);
  });

  it.each([
    ["non-leap February", "2027-01-31", "2027-02-28"],
    ["leap February", "2028-01-31", "2028-02-29"],
    ["30-day move-in date", "2027-01-30", "2027-02-28"],
  ])("matches server month-end clamping for %s", (_label, checkIn, checkOut) => {
    expect(isStayWithinBounds(checkIn, checkOut, 1, null)).toBe(true);
    expect(getWholeMonthTerm(checkIn, checkOut)).toEqual({
      months: 1,
      isMonthEndClamped: true,
    });
  });

  it("does not mark an un-clamped monthly anniversary as adjusted", () => {
    expect(getWholeMonthTerm("2027-01-15", "2027-02-15")).toEqual({
      months: 1,
      isMonthEndClamped: false,
    });
  });

  it("honors listing minimum and maximum stay bounds", () => {
    expect(isStayWithinBounds("2026-06-01", "2026-07-01", 2, null)).toBe(false);
    expect(isStayWithinBounds("2026-06-01", "2026-08-01", 1, 1)).toBe(false);
    expect(isStayWithinBounds("2026-06-01", "2026-08-01", 2, 2)).toBe(true);
  });

  it("caps null and oversized listing maxima at 24 months", () => {
    expect(getEffectiveMaxStay(1, null)).toBe(24);
    expect(getEffectiveMaxStay(1, 36)).toBe(24);
    expect(isStayWithinBounds("2026-01-31", "2028-01-31", 1, null)).toBe(true);
    expect(isStayWithinBounds("2026-01-31", "2028-02-29", 1, null)).toBe(false);
  });

  it("treats impossible or malformed listing stay bounds as unbookable", () => {
    for (const [minStay, maxStay] of [
      [0, null],
      [-1, null],
      [1.5, 3],
      [25, null],
      [3, 2],
      [1, 0],
      [1, 2.5],
    ] as const) {
      expect(areStayBoundsValid(minStay, maxStay)).toBe(false);
      expect(isStayWithinBounds("2026-06-01", "2026-07-01", minStay, maxStay)).toBe(false);
    }
  });

  it("rejects missing, reversed, malformed, and impossible date-only values", () => {
    expect(isStayWithinBounds("", "2026-07-01", 1, null)).toBe(false);
    expect(isStayWithinBounds("2026-07-01", "2026-06-01", 1, null)).toBe(false);
    expect(isStayWithinBounds("2026-02-30", "2026-03-30", 1, null)).toBe(false);
    expect(isStayWithinBounds("2026-6-01", "2026-07-01", 1, null)).toBe(false);
  });
});
