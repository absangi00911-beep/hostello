import { describe, expect, it } from "vitest";
import { formatDateOnlyForDisplay } from "./format-date-only";

describe("formatDateOnlyForDisplay", () => {
  it("writes a stored date as day, short month, year", () => {
    expect(formatDateOnlyForDisplay("2026-12-15")).toBe("15 Dec 2026");
    expect(formatDateOnlyForDisplay("2027-01-05")).toBe("5 Jan 2027");
  });

  it("never shows the raw YYYY-MM-DD value", () => {
    expect(formatDateOnlyForDisplay("2026-12-15")).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it("keeps the calendar day whatever the viewer's time zone", () => {
    // Month-end and year-end are where a UTC/local mix-up shifts the day.
    expect(formatDateOnlyForDisplay("2026-12-31")).toBe("31 Dec 2026");
    expect(formatDateOnlyForDisplay("2028-02-29")).toBe("29 Feb 2028");
  });

  it("returns the input unchanged when it is not a date", () => {
    expect(formatDateOnlyForDisplay("")).toBe("");
    expect(formatDateOnlyForDisplay("not-a-date")).toBe("not-a-date");
  });
});
