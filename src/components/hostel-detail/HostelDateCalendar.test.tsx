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

  it("states the monthly anniversary rule and one effective maximum stay", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-15T12:00:00.000Z"));
    const markup = renderCalendar(2, 36);

    expect(markup).toContain("move-out date exactly 2 months or more later");
    expect(markup).toContain("Maximum stay: 24 months");
    expect(markup).not.toContain("Global maximum");
    expect(markup).toContain('aria-label="Select move-in date 15 Jan 2027"');
    expect(markup).toContain("Monthly anniversaries clamp to the last day of shorter months");
  });

  it("uses the available mobile width for seven date targets", () => {
    const markup = renderCalendar(1, null);

    expect(markup).toContain("max-w-[390px]");
    expect(markup).toContain("w-[min(100%,44px)]");
  });

  it.each([
    ["non-leap year", "2027-01-01T12:00:00.000Z", "2027-01-31", "28 Feb 2027"],
    ["leap year", "2028-01-01T12:00:00.000Z", "2028-01-31", "29 Feb 2028"],
  ])("enables only the server-matching month-end checkout in a %s", (_label, now, checkIn, expectedDate) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));
    dateSelection.checkIn = checkIn;
    const markup = renderCalendar(1, null);
    const expectedCheckout = markup.match(
      new RegExp(`<button[^>]*aria-label="Select move-out date ${expectedDate}"[^>]*>`),
    )?.[0];
    const partialCheckout = markup.match(
      new RegExp(`<button[^>]*aria-label="Select move-out date ${expectedDate.startsWith("28") ? "27" : "28"} Feb ${expectedDate.slice(-4)}"[^>]*>`),
    )?.[0];

    expect(expectedCheckout).toBeDefined();
    expect(expectedCheckout).not.toMatch(/\sdisabled(?:=|\s|>)/);
    expect(partialCheckout).toMatch(/\sdisabled(?:=|\s|>)/);
  });

  it("announces the next step for the current selection", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-15T12:00:00.000Z"));

    expect(renderCalendar(1, null)).toContain("Choose a move-in date.");

    dateSelection.checkIn = "2027-01-20";
    expect(renderCalendar(2, null)).toContain(
      "Move-in 20 Jan 2027. Now choose a move-out date at least 2 months later.",
    );

    dateSelection.checkOut = "2027-03-20";
    expect(renderCalendar(2, null)).toContain(
      "Move-in 20 Jan 2027. Move-out 20 Mar 2027.",
    );
  });

  it("exposes a single roving tab stop for the whole date grid", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-15T12:00:00.000Z"));
    const markup = renderCalendar(1, null);
    const dateButtons = markup.match(/<button[^>]*data-calendar-date="[^"]*"[^>]*>/g) ?? [];
    const tabStops = dateButtons.filter((button) => button.includes('tabindex="0"'));

    expect(dateButtons.length).toBeGreaterThan(50);
    expect(tabStops).toHaveLength(1);
    expect(tabStops[0]).toContain('data-calendar-date="2027-01-15"');
  });

  it("keeps invalid listing bounds visible as a booking blocker", () => {
    const markup = renderCalendar(25, null);

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("stay requirements are invalid, so booking is unavailable");
  });
});
