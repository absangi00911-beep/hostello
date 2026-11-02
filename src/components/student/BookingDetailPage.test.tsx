import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import {
  BookingDetailPage,
  getPaymentNotice,
  isReturnFromCheckout,
  parseBookingDetail,
} from "./BookingDetailPage";

const validBooking = {
  id: "b1",
  checkIn: "2026-12-01T00:00:00.000Z",
  checkOut: "2027-01-01T00:00:00.000Z",
  months: 1,
  guests: 1,
  total: 25000,
  status: "PENDING",
  paymentStatus: "PENDING",
  cancellationPolicy: "STANDARD",
  ownerResponseDueAt: null,
  hostel: {
    id: "h1",
    name: "Gulberg Stay",
    slug: "gulberg-stay",
    coverImage: null,
    city: "Lahore",
    area: "Gulberg",
    address: null,
  },
};

describe("parseBookingDetail", () => {
  it("accepts a valid API payload", () => {
    const parsed = parseBookingDetail({ data: validBooking });

    expect(parsed?.hostel.name).toBe("Gulberg Stay");
    expect(parsed?.cancellationPolicy).toBe("STANDARD");
  });

  it("rejects unknown statuses and missing hostel data", () => {
    expect(
      parseBookingDetail({ data: { ...validBooking, status: "WEIRD" } }),
    ).toBeNull();
    expect(
      parseBookingDetail({ data: { ...validBooking, hostel: null } }),
    ).toBeNull();
    expect(parseBookingDetail(null)).toBeNull();
  });

  it("drops an unrecognised cancellation policy", () => {
    const parsed = parseBookingDetail({
      data: { ...validBooking, cancellationPolicy: "ANYTIME" },
    });

    expect(parsed?.cancellationPolicy).toBeNull();
  });
});

describe("getPaymentNotice", () => {
  it("maps known provider return codes", () => {
    expect(getPaymentNotice("failed")).toMatch(/did not go through/);
    expect(getPaymentNotice("cancelled")).toMatch(/cancelled/);
  });

  it("ignores unknown or missing codes", () => {
    expect(getPaymentNotice("constructor")).toBeNull();
    expect(getPaymentNotice("<b>")).toBeNull();
    expect(getPaymentNotice(null)).toBeNull();
  });
});

describe("isReturnFromCheckout", () => {
  it("is true only when the customer came back from the provider", () => {
    expect(isReturnFromCheckout("return")).toBe(true);
    expect(isReturnFromCheckout("pending")).toBe(true);
    expect(isReturnFromCheckout("cancelled")).toBe(false);
    expect(isReturnFromCheckout("failed")).toBe(false);
    expect(isReturnFromCheckout(null)).toBe(false);
  });
});

describe("BookingDetailPage", () => {
  it("renders the loading state first", () => {
    const markup = renderToStaticMarkup(
      <BookingDetailPage bookingId="b1" paymentCode={null} />,
    );

    expect(markup).toContain("Loading booking...");
  });
});
