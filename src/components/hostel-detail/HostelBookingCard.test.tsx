import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HostelBookingCard } from "./HostelBookingCard";
import { HostelDateSelectionProvider } from "./HostelDateSelectionProvider";

describe("HostelBookingCard", () => {
  it("renders a fixed mobile reserve action that leads into date selection", () => {
    const markup = renderToStaticMarkup(
      <HostelDateSelectionProvider>
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
              available: 2,
            },
          ]}
        />
      </HostelDateSelectionProvider>,
    );

    expect(markup).toContain('aria-label="Quick reserve"');
    expect(markup).toContain("hostel-booking-mobile-bar");
    expect(markup).toContain('type="button">Choose dates</button>');
  });
});
