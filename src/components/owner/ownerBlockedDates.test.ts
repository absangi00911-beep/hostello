import { describe, expect, it } from "vitest";
import {
  formatBlockedRange,
  parseBlockedRangesPage,
  parseCreatedRange,
  readBlockedDatesError,
  validateBlockedRange,
} from "./ownerBlockedDates";

const range = {
  id: "b1",
  startDate: "2026-10-10T00:00:00.000Z",
  endDate: "2026-10-12T00:00:00.000Z",
  reason: "Repairs",
};

describe("parseBlockedRangesPage", () => {
  it("accepts the GET shape", () => {
    const parsed = parseBlockedRangesPage({
      data: [range],
      page: 1,
      limit: 20,
      total: 1,
      hasMore: false,
    });
    expect(parsed?.data[0]).toEqual(range);
    expect(parsed?.total).toBe(1);
  });

  it("keeps a missing reason as null", () => {
    const parsed = parseBlockedRangesPage({
      data: [{ ...range, reason: null }],
      page: 1,
      total: 1,
      hasMore: false,
    });
    expect(parsed?.data[0].reason).toBeNull();
  });

  it("rejects unexpected shapes", () => {
    expect(parseBlockedRangesPage(null)).toBeNull();
    expect(
      parseBlockedRangesPage({ data: [{ id: 1 }], page: 1, total: 1, hasMore: false }),
    ).toBeNull();
  });
});

describe("parseCreatedRange", () => {
  it("reads { data } from the POST response", () => {
    expect(parseCreatedRange({ data: range })?.id).toBe("b1");
    expect(parseCreatedRange({})).toBeNull();
  });
});

describe("validateBlockedRange", () => {
  const ok = { startDate: "2026-10-10", endDate: "2026-10-12", reason: "" };

  it("accepts a valid range, including a single day", () => {
    expect(validateBlockedRange(ok)).toBeNull();
    expect(validateBlockedRange({ ...ok, endDate: "2026-10-10" })).toBeNull();
  });

  it("requires both dates", () => {
    expect(validateBlockedRange({ ...ok, startDate: "" })).toContain("Choose");
    expect(validateBlockedRange({ ...ok, endDate: "" })).toContain("Choose");
  });

  it("rejects an end before the start", () => {
    expect(validateBlockedRange({ ...ok, endDate: "2026-10-09" })).toContain("on or after");
  });

  it("limits the reason to 250 characters", () => {
    expect(validateBlockedRange({ ...ok, reason: "x".repeat(251) })).toContain("250");
    expect(validateBlockedRange({ ...ok, reason: "x".repeat(250) })).toBeNull();
  });
});

describe("formatBlockedRange", () => {
  // The separator between day, month and year depends on the ICU build, so
  // match on the day numbers instead of an exact string.
  const dayNumbers = (text: string) => text.match(/\d+/g);

  it("formats in UTC so dates don't shift", () => {
    const text = formatBlockedRange(
      "2026-10-10T00:00:00.000Z",
      "2026-10-12T23:30:00.000Z",
    );
    expect(dayNumbers(text)).toEqual(["10", "2026", "12", "2026"]);
    expect(text).toContain("–");
  });

  it("collapses a single day", () => {
    const text = formatBlockedRange(
      "2026-10-10T00:00:00.000Z",
      "2026-10-10T00:00:00.000Z",
    );
    expect(dayNumbers(text)).toEqual(["10", "2026"]);
    expect(text).not.toContain("–");
  });
});

describe("readBlockedDatesError", () => {
  it("uses the API message or the fallback", () => {
    expect(readBlockedDatesError({ error: "Not found" }, "x")).toBe("Not found");
    expect(readBlockedDatesError(null, "fallback")).toBe("fallback");
  });
});
