import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  buildExactAvailabilityUrl,
  parseExactAvailability,
  parseBookingOutcome,
  HostelBookingCard,
} from "./HostelBookingCard";
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
            },
          ]}
        />
      </HostelDateSelectionProvider>,
    );

    expect(markup).toContain('aria-label="Quick reserve"');
    expect(markup).toContain("hostel-booking-mobile-bar");
    expect(markup).toContain('type="button">Choose a room</button>');
    expect(markup).toContain(">Guests</span>");
  });

  it("keeps every booking control at least 44 pixels tall", () => {
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
            },
          ]}
        />
      </HostelDateSelectionProvider>,
    );

    expect([...markup.matchAll(/class="min-h-11 w-full/g)]).toHaveLength(4);
  });

  it("requires the student to choose a room instead of preselecting one", () => {
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
            },
          ]}
        />
      </HostelDateSelectionProvider>,
    );

    expect(markup).toMatch(/<option[^>]*disabled[^>]*value=""[^>]*>Choose a room<\/option>/);
  });

  it("requests exact availability for the selected hostel, stay, and guests", () => {
    expect(
      buildExactAvailabilityUrl("green view", "2099-03-10", "2099-03-13", 2),
    ).toBe(
      "/api/hostels/green%20view/availability/exact?checkIn=2099-03-10&checkOut=2099-03-13&guests=2",
    );
  });

  it("accepts only server-shaped room availability and does not infer a fit", () => {
    expect(
      parseExactAvailability({
        data: [
          { roomId: "room-1", capacity: 2, availableSeats: 1, fits: false },
          { roomId: "room-2", capacity: 4, availableSeats: 4, fits: true },
        ],
      }),
    ).toEqual([
      { roomId: "room-1", capacity: 2, availableSeats: 1, fits: false },
      { roomId: "room-2", capacity: 4, availableSeats: 4, fits: true },
    ]);
    expect(
      parseExactAvailability({
        data: [{ roomId: "room-1", capacity: 2, availableSeats: 2 }],
      }),
    ).toBeNull();
  });

  it("preserves server-confirmed booking and payment states as separate values", () => {
    expect(
      parseBookingOutcome({
        data: {
          id: "booking-1",
          total: 44000,
          status: "PENDING",
          paymentStatus: "PENDING",
        },
      }),
    ).toEqual({
      id: "booking-1",
      total: 44000,
      status: "PENDING",
      paymentStatus: "PENDING",
    });
    expect(
      parseBookingOutcome({
        data: {
          id: "booking-1",
          total: 44000,
          status: "CONFIRMED",
          paymentStatus: "FAILED",
        },
      }),
    ).toMatchObject({ status: "CONFIRMED", paymentStatus: "FAILED" });
    expect(
      parseBookingOutcome({
        data: { id: "booking-1", total: 44000, status: "PENDING" },
      }),
    ).toBeNull();
  });
});
