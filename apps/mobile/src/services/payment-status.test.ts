import { describe, expect, it } from "vitest";
import { parsePaymentReturnBookingId, resolvePaymentOutcome } from "./payment-status";

describe("parsePaymentReturnBookingId", () => {
  it("accepts the exact Hostello payment return URL", () => {
    expect(parsePaymentReturnBookingId("hostello://payment/return?bookingId=booking-1")).toBe("booking-1");
  });

  it.each([
    "hostello://payment/return.attacker?bookingId=booking-1",
    "hostello://payment/return/extra?bookingId=booking-1",
    "https://hostello.pk/payment/return?bookingId=booking-1",
    "hostello://payment/return?bookingId=booking-1&bookingId=booking-2",
    "not a URL",
  ])("rejects an invalid payment return URL: %s", (url) => {
    expect(parsePaymentReturnBookingId(url)).toBeNull();
  });

  it("rejects oversized return URLs and booking IDs", () => {
    expect(parsePaymentReturnBookingId(`hostello://payment/return?bookingId=${"a".repeat(65)}`)).toBeNull();
    expect(parsePaymentReturnBookingId(`hostello://payment/return?bookingId=booking-1&x=${"a".repeat(2_048)}`)).toBeNull();
  });
});

describe("resolvePaymentOutcome", () => {
  it("confirms payment only from the server's PAID state", () => {
    expect(resolvePaymentOutcome({ paymentStatus: "PAID", bookingStatus: "CONFIRMED" })).toBe("paid");
  });

  it("distinguishes a late payment for a cancelled booking", () => {
    expect(resolvePaymentOutcome({ paymentStatus: "PAID", bookingStatus: "CANCELLED" })).toBe("paid_cancelled");
  });

  it("reports a recorded refund", () => {
    expect(resolvePaymentOutcome({ paymentStatus: "REFUNDED", bookingStatus: "CANCELLED" })).toBe("refunded");
  });

  it("reports failure only when the server records FAILED", () => {
    expect(resolvePaymentOutcome({ paymentStatus: "FAILED", bookingStatus: "PENDING" })).toBe("failed");
  });

  it("does not treat a pending payment as paid", () => {
    expect(resolvePaymentOutcome({ paymentStatus: "PENDING", bookingStatus: "PENDING" })).toBe("checking");
  });

  it("reports an unpaid cancelled booking", () => {
    expect(resolvePaymentOutcome({ paymentStatus: "PENDING", bookingStatus: "CANCELLED" })).toBe("cancelled");
  });

  it("does not offer a failed-payment retry for a cancelled booking", () => {
    expect(resolvePaymentOutcome({ paymentStatus: "FAILED", bookingStatus: "CANCELLED" })).toBe("cancelled");
  });
});
