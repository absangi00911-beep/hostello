import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const dateSelection = vi.hoisted(() => ({
  checkIn: "2027-01-31",
  checkOut: "2027-02-28",
}));
vi.mock("./HostelDateSelectionProvider", () => ({
  useHostelDateSelection: () => ({
    ...dateSelection,
    setMoveIn: vi.fn(),
    setMoveOut: vi.fn(),
  }),
}));

import { HostelBookingCard } from "./HostelBookingCard";

describe("HostelBookingCard monthly term feedback", () => {
  afterEach(() => vi.useRealTimers());

  it("announces the monthly term and a clamped month-end checkout", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-01T12:00:00.000Z"));
    const markup = renderToStaticMarkup(
      <HostelBookingCard
        hasCancellationPolicy
        hostelId="hostel-1"
        maxStay={null}
        minStay={1}
        rooms={[
          {
            id: "room-1",
            name: "Twin room",
            pricePerMonth: 25000,
            capacity: 2,
          },
        ]}
      />,
    );

    expect(markup).toContain("Selected term: 1 month.");
    expect(markup).toContain("Move-out is clamped to");
    expect(markup).toContain("target month has fewer days than your move-in date");
    expect(markup).toContain('aria-live="polite"');
  });
});
