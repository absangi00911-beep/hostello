import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const dateSelection = vi.hoisted(() => ({ checkIn: "", checkOut: "" }));
vi.mock("./HostelDateSelectionProvider", () => ({
  useHostelDateSelection: () => ({
    ...dateSelection,
    selectMoveIn: vi.fn(),
    setMoveOut: vi.fn(),
  }),
}));

import { HostelDateCalendar } from "./HostelDateCalendar";

function renderCalendar(minStay: number, maxStay: number | null): string {
  return renderToStaticMarkup(
    <HostelDateCalendar minStay={minStay} maxStay={maxStay} />,
  );
}

describe("HostelDateCalendar", () => {
  afterEach(() => {
    vi.useRealTimers();
    dateSelection.checkIn = "";
    dateSelection.checkOut = "";
  });

  it("states the monthly anniversary rule, listing limit, and global 24-month cap", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-15T12:00:00.000Z"));
    const markup = renderCalendar(2, 36);

    expect(markup).toContain("move-out date exactly 2 months or more later");
    expect(markup).toContain("maximum stay: 24 months");
    expect(markup).toContain("Global maximum: 24 months");
    expect(markup).toContain('aria-label="Select move-in date January 15, 2027"');
    expect(markup).toContain("Monthly anniversaries clamp to the last day of shorter months");
  });

  it("uses the available mobile width for seven date targets", () => {
    const markup = renderCalendar(1, null);

    expect(markup).toContain("w-[calc(100%_+_40px)]");
    expect(markup).toContain("w-[min(100%,44px)]");
  });

  it.each([
    ["non-leap year", "2027-01-01T12:00:00.000Z", "2027-01-31", "February 28, 2027"],
    ["leap year", "2028-01-01T12:00:00.000Z", "2028-01-31", "February 29, 2028"],
  ])("enables only the server-matching month-end checkout in a %s", (_label, now, checkIn, expectedDate) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));
    dateSelection.checkIn = checkIn;
    const markup = renderCalendar(1, null);
    const expectedCheckout = markup.match(
      new RegExp(`<button[^>]*aria-label="Select move-out date ${expectedDate}"[^>]*>`),
    )?.[0];
    const partialCheckout = markup.match(
      new RegExp(`<button[^>]*aria-label="Select move-out date February ${expectedDate.includes("28") ? "27" : "28"}, ${expectedDate.slice(-4)}"[^>]*>`),
    )?.[0];

    expect(expectedCheckout).toBeDefined();
    expect(expectedCheckout).not.toMatch(/\sdisabled(?:=|\s|>)/);
    expect(partialCheckout).toMatch(/\sdisabled(?:=|\s|>)/);
  });

  it("keeps invalid listing bounds visible as a booking blocker", () => {
    const markup = renderCalendar(25, null);

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("stay requirements are invalid, so booking is unavailable");
  });
});
