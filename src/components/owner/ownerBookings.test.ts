import { describe, expect, it } from "vitest";
import {
  formatTimeLeft,
  getResponseDeadline,
  getResponseState,
  parseBookingsPage,
  readActionMessage,
  type OwnerBooking,
} from "./ownerBookings";

const apiBooking = {
  id: "b1",
  status: "PENDING",
  paymentStatus: "PAID",
  checkIn: "2026-12-01T00:00:00.000Z",
  checkOut: "2027-01-01T00:00:00.000Z",
  months: 1,
  guests: 1,
  total: 12000,
  createdAt: "2026-11-02T06:00:00.000Z",
  ownerResponseDueAt: "2026-11-03T06:00:00.000Z",
  hostel: { id: "h1", name: "Green Hostel", slug: "green" },
  user: { id: "u1", name: "Ayesha", email: "a@example.com", phone: null },
};

const booking = (overrides: Partial<OwnerBooking> = {}): OwnerBooking => ({
  ...(parseBookingsPage({ data: [apiBooking], total: 1, page: 1, hasMore: false })!
    .data[0] as OwnerBooking),
  ...overrides,
});

describe("parseBookingsPage", () => {
  it("maps the /api/bookings owner shape and normalizes nulls", () => {
    const parsed = parseBookingsPage({
      data: [apiBooking],
      total: 1,
      page: 1,
      limit: 20,
      hasMore: false,
    });

    expect(parsed?.data[0]).toMatchObject({
      id: "b1",
      hostel: { id: "h1", name: "Green Hostel" },
      student: { name: "Ayesha", email: "a@example.com", phone: null },
    });
  });

  it("rejects unknown statuses, bad dates and malformed rows", () => {
    const page = (row: unknown) => ({ data: [row], total: 1, page: 1, hasMore: false });

    expect(parseBookingsPage(page({ ...apiBooking, status: "HELD" }))).toBeNull();
    expect(parseBookingsPage(page({ ...apiBooking, checkIn: "soon" }))).toBeNull();
    expect(parseBookingsPage(page({ ...apiBooking, user: null }))).toBeNull();
    expect(parseBookingsPage(null)).toBeNull();
  });
});

describe("response window", () => {
  const due = Date.parse("2026-11-03T06:00:00.000Z");

  it("uses the stored deadline, else 24 hours after the request", () => {
    expect(getResponseDeadline(booking())).toBe(due);
    expect(getResponseDeadline(booking({ ownerResponseDueAt: null }))).toBe(due);
  });

  it("counts down, flags urgency inside four hours and expires at the deadline", () => {
    expect(getResponseState(booking(), due - 5 * 3_600_000)).toEqual({
      kind: "open",
      label: "Respond within 5h 0m",
      urgent: false,
    });
    expect(getResponseState(booking(), due - 90 * 60_000)).toMatchObject({
      label: "Respond within 1h 30m",
      urgent: true,
    });
    expect(getResponseState(booking(), due)).toEqual({ kind: "expired" });
  });

  it("only applies to pending requests", () => {
    expect(getResponseState(booking({ status: "CONFIRMED" }), due - 1)).toEqual({
      kind: "none",
    });
  });

  it("formats short durations", () => {
    expect(formatTimeLeft(30_000)).toBe("less than a minute");
    expect(formatTimeLeft(12 * 60_000)).toBe("12m");
  });
});

describe("readActionMessage", () => {
  it("prefers the API message", () => {
    expect(readActionMessage({ message: "Booking confirmed." }, "x")).toBe("Booking confirmed.");
    expect(readActionMessage(null, "fallback")).toBe("fallback");
  });
});
