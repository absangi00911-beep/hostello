import { describe, expect, it } from "vitest";
import {
  isUnresolved,
  parseRefundBookingsPage,
  refundOutcome,
  refundStateLabel,
  remainingRefund,
} from "./adminRefunds";

const apiBooking = (overrides: Record<string, unknown> = {}) => ({
  id: "b1",
  status: "CANCELLED",
  paymentStatus: "PAID",
  refundState: "NONE",
  total: 20000,
  cancellationRefundAmount: 15000,
  refundedAmount: 0,
  checkIn: "2026-12-01T00:00:00.000Z",
  checkOut: "2027-01-01T00:00:00.000Z",
  hostel: { name: "Green Hostel" },
  user: { name: "Ayesha", email: "ayesha@example.com" },
  ...overrides,
});

const page = (data: unknown[]) => ({
  data,
  total: data.length,
  page: 1,
  limit: 50,
  hasMore: false,
});

describe("remainingRefund", () => {
  it("uses the approved amount, capped at the total, minus refunds", () => {
    expect(remainingRefund(20000, 15000, 0)).toBe(15000);
    expect(remainingRefund(20000, null, 0)).toBe(20000);
    expect(remainingRefund(20000, 30000, 0)).toBe(20000);
    expect(remainingRefund(20000, 15000, 5000)).toBe(10000);
    expect(remainingRefund(20000, 15000, 15000)).toBe(0);
  });
});

describe("parseRefundBookingsPage", () => {
  it("keeps paid cancelled bookings with money left", () => {
    const parsed = parseRefundBookingsPage(page([apiBooking()]));
    expect(parsed?.data).toHaveLength(1);
    expect(parsed?.data[0]).toMatchObject({
      id: "b1",
      studentName: "Ayesha",
      approvedAmount: 15000,
      remainingAmount: 15000,
    });
    expect(parsed?.scanned).toBe(1);
  });

  it("drops bookings that cannot be refunded", () => {
    const parsed = parseRefundBookingsPage(
      page([
        apiBooking({ id: "unpaid", paymentStatus: "PENDING" }),
        apiBooking({ id: "failed", paymentStatus: "FAILED" }),
        apiBooking({ id: "done", paymentStatus: "REFUNDED", refundState: "REFUNDED" }),
        apiBooking({ id: "nothing", cancellationRefundAmount: 0 }),
        apiBooking({
          id: "settled",
          paymentStatus: "PARTIALLY_REFUNDED",
          refundedAmount: 15000,
        }),
        apiBooking({ id: "keep", paymentStatus: "PARTIALLY_REFUNDED", refundedAmount: 5000 }),
      ]),
    );
    expect(parsed?.data.map((booking) => booking.id)).toEqual(["keep"]);
    expect(parsed?.scanned).toBe(6);
  });

  it("keeps unresolved refund states", () => {
    const parsed = parseRefundBookingsPage(
      page([apiBooking({ refundState: "UNCERTAIN" })]),
    );
    expect(parsed?.data[0].refundState).toBe("UNCERTAIN");
  });

  it("rejects unexpected shapes", () => {
    expect(parseRefundBookingsPage(null)).toBeNull();
    expect(parseRefundBookingsPage({ ...page([]), total: "0" })).toBeNull();
    expect(parseRefundBookingsPage(page([apiBooking({ hostel: null })]))).toBeNull();
    expect(parseRefundBookingsPage(page([apiBooking({ total: "x" })]))).toBeNull();
  });
});

describe("labels and outcomes", () => {
  it("labels states and flags unresolved ones", () => {
    expect(refundStateLabel("UNCERTAIN")).toBe("Outcome unconfirmed");
    expect(refundStateLabel("PROCESSING")).toBe("Refund in progress");
    expect(isUnresolved("UNCERTAIN")).toBe(true);
    expect(isUnresolved("PROCESSING")).toBe(true);
    expect(isUnresolved("NONE")).toBe(false);
  });

  it("reports an unconfirmed automatic refund as a warning, not a success", () => {
    expect(refundOutcome("Ayesha", { automatic: true, manualConfirmed: false }).tone).toBe("success");
    expect(refundOutcome("Ayesha", { automatic: false, manualConfirmed: true }).tone).toBe("success");
    const unconfirmed = refundOutcome("Ayesha", { automatic: false, manualConfirmed: false });
    expect(unconfirmed.tone).toBe("error");
    expect(unconfirmed.text).toContain("not confirmed");
  });
});
