import { describe, expect, it } from "vitest";
import { addUtcDays, getCalendarFocusTarget } from "./calendar-keyboard";

const today = "2027-01-15"; // a Friday
const never = () => false;

describe("getCalendarFocusTarget", () => {
  it("moves by a day or a week with the arrow keys", () => {
    expect(getCalendarFocusTarget("2027-01-20", "ArrowRight", today, never)).toBe("2027-01-21");
    expect(getCalendarFocusTarget("2027-01-20", "ArrowLeft", today, never)).toBe("2027-01-19");
    expect(getCalendarFocusTarget("2027-01-20", "ArrowDown", today, never)).toBe("2027-01-27");
    // One week back from the 20th would be the 13th, before today, so focus stays put.
    expect(getCalendarFocusTarget("2027-01-20", "ArrowUp", today, never)).toBeNull();
    expect(getCalendarFocusTarget("2027-02-10", "ArrowUp", today, never)).toBe("2027-02-03");
  });

  it("goes to the start and end of the week", () => {
    // 2027-01-20 is a Wednesday; weeks run Sunday to Saturday.
    expect(getCalendarFocusTarget("2027-01-20", "Home", today, never)).toBe("2027-01-17");
    expect(getCalendarFocusTarget("2027-01-20", "End", today, never)).toBe("2027-01-23");
  });

  it("changes month with Page Up and Page Down, clamping to a shorter month", () => {
    expect(getCalendarFocusTarget("2027-01-31", "PageDown", today, never)).toBe("2027-02-28");
    expect(getCalendarFocusTarget("2027-03-10", "PageUp", today, never)).toBe("2027-02-10");
  });

  it("never moves focus to a date before today", () => {
    expect(getCalendarFocusTarget("2027-01-15", "ArrowLeft", today, never)).toBeNull();
    expect(getCalendarFocusTarget("2027-01-16", "PageUp", today, never)).toBeNull();
  });

  it("scans past dates that cannot be selected", () => {
    const onlyMonthEnds = (value: string) => !value.endsWith("-28");
    expect(getCalendarFocusTarget("2027-01-20", "ArrowRight", today, onlyMonthEnds)).toBe("2027-01-28");
    expect(getCalendarFocusTarget("2027-03-05", "ArrowLeft", today, onlyMonthEnds)).toBe("2027-02-28");
  });

  it("gives up when nothing in that direction can be selected", () => {
    expect(getCalendarFocusTarget("2027-01-20", "ArrowRight", today, () => true)).toBeNull();
  });

  it("ignores keys that are not navigation keys", () => {
    expect(getCalendarFocusTarget("2027-01-20", "Enter", today, never)).toBeNull();
    expect(getCalendarFocusTarget("2027-01-20", "constructor", today, never)).toBeNull();
  });

  it("adds days across month and year boundaries", () => {
    expect(addUtcDays("2027-12-31", 1)).toBe("2028-01-01");
    expect(addUtcDays("2028-03-01", -1)).toBe("2028-02-29");
  });
});
