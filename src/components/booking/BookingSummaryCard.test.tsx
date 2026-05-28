import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BookingSummaryCard } from "@/components/booking/BookingSummaryCard";

const booking = {
  id: "booking-1",
  checkIn: "2026-06-01T00:00:00.000Z",
  checkOut: "2026-07-01T00:00:00.000Z",
  months: 1,
  guests: 1,
  total: 32000,
  status: "PENDING",
  paymentStatus: "PENDING",
  hostel: {
    name: "North Campus Hostel",
    slug: "north-campus-hostel",
    city: "Lahore",
    area: "Gulberg",
    coverImage: null,
  },
};

describe("BookingSummaryCard", () => {
  it("shows payment context when requested", () => {
    const markup = renderToStaticMarkup(
      <BookingSummaryCard booking={booking} showPaymentHint />,
    );

    expect(markup).toContain("Payment pending");
    expect(markup).toContain("secure payment");
  });

  it("keeps the summary compact by default", () => {
    const markup = renderToStaticMarkup(<BookingSummaryCard booking={booking} />);

    expect(markup).not.toContain("Payment pending");
  });
});
