// Path: src/lib/refunds.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: (() => {
    const booking = {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    };
    const refundAuditEvent = {
      create: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(null),
    };
    const transactionClient = { booking, refundAuditEvent };
    return {
      booking,
      refundAuditEvent,
      $transaction: vi.fn(async <T>(
        callback: (tx: typeof transactionClient) => Promise<T>,
      ) => callback(transactionClient)),
    };
  })(),
}));

vi.mock("@/lib/safepay", () => ({
  refundPayment: vi.fn(),
}));

vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/email-templates/booking-status", () => ({
  bookingRefundedEmail: vi.fn().mockReturnValue({ to: "student@test.com", subject: "x", html: "x" }),
}));

import { confirmManualRefund, processRefund } from "./refunds";
import { db } from "../lib/db";
import { refundPayment } from "../lib/safepay";
import { createNotification } from "../lib/notifications";
import { sendEmail } from "../lib/email";

const BOOKING_ID = "bkg_0000000000000000000001";
const ADMIN_ID = "usr_admin_0000000000000001";

function makeBooking(overrides = {}) {
  return {
    id: BOOKING_ID,
    userId: "usr_student_0000000000001",
    total: 45000,
    status: "CANCELLED",
    paymentStatus: "PAID",
    transactionId: "sfpy_txn_12345",
    refundedAt: null,
    refundedBy: null,
    user: { name: "Ayesha Khan", email: "ayesha@test.com" },
    hostel: { name: "Green View Hostel" },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("processRefund — precondition checks", () => {
  it("throws 'Booking not found' when the booking doesn't exist", async () => {
    vi.mocked(db.booking.findUnique).mockResolvedValue(null);

    await expect(processRefund(BOOKING_ID, ADMIN_ID)).rejects.toThrow("Booking not found");
    expect(refundPayment).not.toHaveBeenCalled();
  });

  it("rejects a booking that isn't PAID", async () => {
    vi.mocked(db.booking.findUnique).mockResolvedValue(makeBooking({ paymentStatus: "REFUNDED" }) as any);

    await expect(processRefund(BOOKING_ID, ADMIN_ID)).rejects.toThrow(
      "requires PAID + CANCELLED",
    );
    expect(refundPayment).not.toHaveBeenCalled();
    expect(db.booking.updateMany).not.toHaveBeenCalled();
  });

  it("rejects a booking that isn't CANCELLED", async () => {
    vi.mocked(db.booking.findUnique).mockResolvedValue(makeBooking({ status: "CONFIRMED" }) as any);

    await expect(processRefund(BOOKING_ID, ADMIN_ID)).rejects.toThrow(
      "requires PAID + CANCELLED",
    );
    expect(refundPayment).not.toHaveBeenCalled();
  });

  it("rejects a PENDING+CANCELLED booking (never actually paid, nothing to refund)", async () => {
    vi.mocked(db.booking.findUnique).mockResolvedValue(
      makeBooking({ paymentStatus: "PENDING", status: "CANCELLED" }) as any,
    );

    await expect(processRefund(BOOKING_ID, ADMIN_ID)).rejects.toThrow(
      "requires PAID + CANCELLED",
    );
  });
});

describe("processRefund — automatic path", () => {
  it("calls refundPayment with the transactionId and full total, marks REFUNDED, returns automatic: true", async () => {
    vi.mocked(db.booking.findUnique).mockResolvedValue(makeBooking() as any);
    vi.mocked(refundPayment).mockResolvedValue({ success: true, raw: {} });
    vi.mocked(db.booking.updateMany).mockResolvedValue({ count: 1 } as any);
    vi.mocked(db.booking.findUniqueOrThrow).mockResolvedValue(
      makeBooking({ paymentStatus: "REFUNDED", refundedBy: ADMIN_ID }) as any,
    );

    const result = await processRefund(BOOKING_ID, ADMIN_ID);

    expect(refundPayment).toHaveBeenCalledWith({ transactionId: "sfpy_txn_12345", amount: 45000 });
    expect(db.booking.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: BOOKING_ID,
        paymentStatus: "PAID",
        status: "CANCELLED",
        refundState: "PROCESSING",
      }),
      data: expect.objectContaining({
        paymentStatus: "REFUNDED",
        refundState: "REFUNDED",
        refundedBy: ADMIN_ID,
        refundedAt: expect.any(Date),
      }),
    }));
    expect(result.automatic).toBe(true);
    expect(result.booking.paymentStatus).toBe("REFUNDED");
  });

  it("notifies the student in-app and by email once the refund lands", async () => {
    vi.mocked(db.booking.findUnique).mockResolvedValue(makeBooking() as any);
    vi.mocked(refundPayment).mockResolvedValue({ success: true, raw: {} });
    vi.mocked(db.booking.updateMany).mockResolvedValue({ count: 1 } as any);
    vi.mocked(db.booking.findUniqueOrThrow).mockResolvedValue(makeBooking({ paymentStatus: "REFUNDED" }) as any);

    await processRefund(BOOKING_ID, ADMIN_ID);
    await new Promise((r) => setTimeout(r, 0)); // let the fire-and-forget calls' microtasks settle

    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "usr_student_0000000000001",
        type: "BOOKING_REFUNDED",
        bookingId: BOOKING_ID,
      }),
    );
    expect(sendEmail).toHaveBeenCalled();
  });

  it("still returns successfully even if the notification dispatch fails", async () => {
    vi.mocked(db.booking.findUnique).mockResolvedValue(makeBooking() as any);
    vi.mocked(refundPayment).mockResolvedValue({ success: true, raw: {} });
    vi.mocked(db.booking.updateMany).mockResolvedValue({ count: 1 } as any);
    vi.mocked(db.booking.findUniqueOrThrow).mockResolvedValue(makeBooking({ paymentStatus: "REFUNDED" }) as any);
    vi.mocked(createNotification).mockRejectedValueOnce(new Error("notification service down"));

    await expect(processRefund(BOOKING_ID, ADMIN_ID)).resolves.toMatchObject({ automatic: true });
  });
});

describe("processRefund — manual fallback path", () => {
  it("keeps the booking PAID and sends no refund notification when provider completion is uncertain", async () => {
    vi.mocked(db.booking.findUnique).mockResolvedValue(makeBooking() as any);
    vi.mocked(refundPayment).mockRejectedValue(new Error("Safepay refund failed: 404 Not Found"));

    const result = await processRefund(BOOKING_ID, ADMIN_ID);

    expect(db.booking.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ refundState: "PROCESSING" }),
      data: { refundState: "UNCERTAIN" },
    }));
    expect(db.booking.updateMany).not.toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ paymentStatus: "REFUNDED" }),
    }));
    expect(result.automatic).toBe(false);
    expect(result.manualConfirmed).toBe(false);
    expect(result.booking.paymentStatus).toBe("PAID");
    expect(createNotification).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("leaves a booking PAID when there's no provider transaction reference", async () => {
    vi.mocked(db.booking.findUnique).mockResolvedValue(makeBooking({ transactionId: null }) as any);

    const result = await processRefund(BOOKING_ID, ADMIN_ID);

    expect(refundPayment).not.toHaveBeenCalled();
    expect(result.automatic).toBe(false);
    expect(result.booking.paymentStatus).toBe("PAID");
    expect(db.booking.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ refundState: "PROCESSING" }),
      data: { refundState: "UNCERTAIN" },
    }));
    expect(db.booking.updateMany).not.toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ paymentStatus: "REFUNDED" }),
    }));
  });
});

describe("confirmManualRefund", () => {
  it("records and notifies only after the admin explicitly confirms an external refund", async () => {
    vi.mocked(db.booking.findUnique).mockResolvedValue(makeBooking() as any);
    vi.mocked(db.booking.updateMany).mockResolvedValue({ count: 1 } as any);
    vi.mocked(db.booking.findUniqueOrThrow).mockResolvedValue(makeBooking({ paymentStatus: "REFUNDED" }) as any);

    const result = await confirmManualRefund(BOOKING_ID, ADMIN_ID);

    expect(result).toMatchObject({ automatic: false, manualConfirmed: true });
    expect(db.booking.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: BOOKING_ID,
        paymentStatus: "PAID",
        status: "CANCELLED",
        refundState: { in: ["NONE", "UNCERTAIN"] },
      }),
    }));
    expect(createNotification).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalled();
  });
});

describe("processRefund — idempotency", () => {
  it("throws when a concurrent request already refunded this booking", async () => {
    vi.mocked(db.booking.findUnique).mockResolvedValue(makeBooking() as any);
    vi.mocked(refundPayment).mockResolvedValue({ success: true, raw: {} });
    vi.mocked(db.booking.updateMany).mockResolvedValue({ count: 0 } as any); // lost the race

    await expect(processRefund(BOOKING_ID, ADMIN_ID)).rejects.toThrow(
      "A refund action is already in progress",
    );
  });
});
