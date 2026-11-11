import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TripsPage, TripsPageContent } from "./TripsPage";

describe("TripsPage", () => {
  it("renders an accessible initial loading state", () => {
    const markup = renderToStaticMarkup(<TripsPage />);

    expect(markup).toContain("Loading trips...");
    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-busy="true"');
  });

  it("renders the booking's real dates, status, and hostel destination", () => {
    const markup = renderToStaticMarkup(
      <TripsPageContent
        bookings={[
          {
            id: "booking-1",
            checkIn: "2026-11-02T00:00:00.000Z",
            checkOut: "2026-12-02T00:00:00.000Z",
            status: "CONFIRMED",
            hostel: {
              name: "Gulberg Student Stay",
              slug: "gulberg-student-stay",
              coverImage: null,
              city: "Lahore",
            },
          },
        ]}
        error={null}
        hasMore={false}
        isLoading={false}
        isLoadingMore={false}
        onLoadMore={() => {}}
        onRetry={() => {}}
      />,
    );

    expect(markup).toContain("Gulberg Student Stay");
    expect(markup).toContain("Lahore");
    expect(markup).toContain("02-Nov-2026");
    expect(markup).toContain("02-Dec-2026");
    expect(markup).toContain('data-status="confirmed"');
    expect(markup).toContain("Confirmed");
  });

  it("renders empty and error states for bookings", () => {
    const emptyMarkup = renderToStaticMarkup(
      <TripsPageContent
        bookings={[]}
        error={null}
        hasMore={false}
        isLoading={false}
        isLoadingMore={false}
        onLoadMore={() => {}}
        onRetry={() => {}}
      />,
    );
    const errorMarkup = renderToStaticMarkup(
      <TripsPageContent
        bookings={[]}
        error="Booking service unavailable."
        hasMore={false}
        isLoading={false}
        isLoadingMore={false}
        onLoadMore={() => {}}
        onRetry={() => {}}
      />,
    );

    expect(emptyMarkup).toContain("No trips yet");
    expect(errorMarkup).toContain('role="alert"');
    expect(errorMarkup).toContain("Booking service unavailable.");
    expect(errorMarkup).toContain("border-danger");
    expect(errorMarkup).toContain("text-danger");
    expect(errorMarkup).not.toContain("#e7c9c4");
    expect(errorMarkup).not.toContain("#8c2822");
  });

  it("keeps cancelled booking status distinct from semantic load errors", () => {
    const markup = renderToStaticMarkup(
      <TripsPageContent
        bookings={[
          {
            id: "booking-1",
            checkIn: "2026-11-02T00:00:00.000Z",
            checkOut: "2026-12-02T00:00:00.000Z",
            status: "CANCELLED",
            hostel: {
              name: "Gulberg Student Stay",
              slug: "gulberg-student-stay",
              coverImage: null,
              city: "Lahore",
            },
          },
        ]}
        error="Could not load additional trips."
        hasMore={false}
        isLoading={false}
        isLoadingMore={false}
        onLoadMore={() => {}}
        onRetry={() => {}}
      />,
    );

    expect(markup).toContain('data-status="cancelled"');
    expect(markup).toContain("bg-[#f5e6e3] text-[#8c2822]");
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Could not load additional trips.");
    expect(markup).toContain("border-danger");
    expect(markup).toContain("text-danger");
    expect(markup).not.toContain("#e7c9c4");
  });
});
