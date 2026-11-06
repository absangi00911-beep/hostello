import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    booking: { findUnique: vi.fn() },
    latePaymentResolution: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock("@/lib/room-availability-service", () => ({
  lockHostelInventory: vi.fn(),
  getRoomStayAvailability: vi.fn(),
  createSeatHolds: vi.fn(),
}));
vi.mock("@/lib/refunds", () => ({ processRefund: vi.fn() }));
vi.mock("@/lib/availability-alerts", () => ({
  reevaluateAvailabilityAlertsForHostel: vi.fn().mockResolvedValue(0),
}));

import { db } from "@/lib/db";
import { reevaluateAvailabilityAlertsForHostel } from "@/lib/availability-alerts";
import {
  createSeatHolds,
  getRoomStayAvailability,
  lockHostelInventory,
} from "@/lib/room-availability-service";
import { processRefund } from "@/lib/refunds";
import { resolveLatePayment } from "./late-payment-resolution";

const booking = {
  id: "booking-1",
  hostelId: "hostel-1",
  roomId: "room-1",
  userId: "student-1",
  status: "CANCELLED",
  paymentStatus: "FAILED",
  paymentMethod: "safepay",
  transactionId: "tracker-1",
  refundState: "NONE",
  payoutId: null,
  refundedAmount: 0,
  checkIn: new Date("2027-01-01T00:00:00.000Z"),
  checkOut: new Date("2027-02-01T00:00:00.000Z"),
  guests: 1,
  total: 25_000,
  hostel: {
    id: "hostel-1",
    name: "Garden Hostel",
    status: "ACTIVE",
    cancellationPolicy: "FLEXIBLE",
    ownerId: "owner-1",
    owner: { id: "owner-1" },
  },
  room: { id: "room-1", hostelId: "hostel-1", capacity: 2 },
  user: { name: "Ayesha" },
};

const tx = {
  booking: { findUnique: vi.fn(), updateMany: vi.fn() },
  latePaymentResolution: { findFirst: vi.fn(), create: vi.fn() },
  notification: { createMany: vi.fn() },
};

const input = {
  bookingId: booking.id,
  sourceWebhookEventId: "event-1",
  providerTracker: "tracker-1",
  amountMinorUnits: booking.total * 100,
  currency: "PKR",
};

beforeEach(() => {
  vi.clearAllMocks();
  tx.booking.findUnique.mockResolvedValue(booking);
  tx.booking.updateMany.mockResolvedValue({ count: 1 });
  tx.latePaymentResolution.findFirst.mockResolvedValue(null);
  tx.latePaymentResolution.create.mockResolvedValue({});
  tx.notification.createMany.mockResolvedValue({ count: 1 });
  vi.mocked(db.$transaction).mockImplementation(((callback: (client: typeof db) => Promise<unknown>) =>
    callback(tx as unknown as typeof db)) as typeof db.$transaction);
  vi.mocked(db.booking.findUnique).mockResolvedValue(null as never);
  vi.mocked(lockHostelInventory).mockResolvedValue(true);
  vi.mocked(getRoomStayAvailability).mockResolvedValue({
    capacity: 2,
    availableSeats: 2,
    availableSeatNumbers: [1, 2],
    fits: true,
    blocked: false,
  });
  vi.mocked(createSeatHolds).mockResolvedValue(undefined);
  vi.mocked(processRefund).mockResolvedValue({} as never);
});

describe("resolveLatePayment", () => {
  it("reinstates only after a locked full-stay allocation and records the source evidence", async () => {
    const result = await resolveLatePayment(input);

    expect(result).toEqual({ outcome: "REINSTATED" });
    expect(lockHostelInventory).toHaveBeenCalledWith(tx, "hostel-1");
    expect(getRoomStayAvailability).toHaveBeenCalledWith(tx, {
      hostelId: "hostel-1",
      roomId: "room-1",
      capacity: 2,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: 1,
    });

    expect(tx.booking.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: "CANCELLED", paymentStatus: { in: ["PENDING", "FAILED"] } }),
      data: expect.objectContaining({
        status: "PENDING",
        paymentStatus: "PAID",
        transactionId: "tracker-1",
        cancellationRefundAmount: null,
      }),
    }));
    expect(createSeatHolds).toHaveBeenCalledWith(tx, expect.objectContaining({
      bookingId: "booking-1",
      roomId: "room-1",
      seatNumbers: [1],
    }));
    expect(tx.latePaymentResolution.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        bookingId: "booking-1",
        sourceWebhookEventId: "event-1",
        providerTracker: "tracker-1",
        reason: "ABANDONED_CHECKOUT",
        outcome: "REINSTATED",
        amount: booking.total,
        currency: "PKR",
      }),
    });
    expect(processRefund).not.toHaveBeenCalled();
  });

  it("reevaluates availability alerts after reinstating the seat hold commits", async () => {
    let committed = false;
    vi.mocked(db.$transaction).mockImplementation((async (callback: any) => {
      const result = await callback(tx);
      committed = true;
      return result;
    }) as typeof db.$transaction);
    vi.mocked(reevaluateAvailabilityAlertsForHostel).mockImplementation(async () => {
      expect(committed).toBe(true);
      return 0;
    });

    await resolveLatePayment(input);

    expect(reevaluateAvailabilityAlertsForHostel).toHaveBeenCalledWith(
      "hostel-1",
      {},
      db,
    );
  });

  it("keeps the booking cancelled and requests a full refund when seats are unavailable", async () => {
    vi.mocked(getRoomStayAvailability).mockResolvedValueOnce({
      capacity: 1,
      availableSeats: 0,
      availableSeatNumbers: [],
      fits: false,
      blocked: false,
    });

    const result = await resolveLatePayment(input);

    expect(result).toEqual({ outcome: "REFUND_REQUIRED" });
    expect(tx.booking.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: "CANCELLED" }),
      data: expect.objectContaining({
        paymentStatus: "PAID",
        transactionId: "tracker-1",
        cancellationRefundAmount: booking.total,
      }),
    }));
    expect(tx.latePaymentResolution.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        reason: "ABANDONED_CHECKOUT",
        outcome: "REFUND_REQUIRED",
        amount: booking.total,
      }),
    });
    expect(tx.notification.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({
        title: "Late payment refund required",
        message: expect.stringContaining("Your payment is under review for a full refund."),
      })],
    });
    expect(processRefund).toHaveBeenCalledWith("booking-1", "system:late-payment");
  });

  it("does not re-run a resolution already recorded for the webhook event or tracker", async () => {
    tx.latePaymentResolution.findFirst.mockResolvedValue({
      bookingId: "booking-1",
      providerTracker: "tracker-1",
      outcome: "REFUND_REQUIRED",
    });

    const result = await resolveLatePayment(input);

    expect(result).toEqual({ outcome: "DUPLICATE" });
    expect(tx.booking.updateMany).not.toHaveBeenCalled();
    expect(tx.latePaymentResolution.create).not.toHaveBeenCalled();
    expect(processRefund).not.toHaveBeenCalled();
  });

  it("does not reinstate a booking after its listing is deactivated", async () => {
    tx.booking.findUnique.mockResolvedValue({
      ...booking,
      hostel: { ...booking.hostel, status: "PAUSED" },
    });
    vi.mocked(getRoomStayAvailability).mockResolvedValueOnce({
      capacity: 2,
      availableSeats: 2,
      availableSeatNumbers: [1, 2],
      fits: true,
      blocked: false,
    });

    const result = await resolveLatePayment({
      ...input,
      paymentStatus: "PENDING",
    });

    expect(result).toEqual({ outcome: "REFUND_REQUIRED" });
    expect(createSeatHolds).not.toHaveBeenCalled();
    expect(tx.booking.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: "CANCELLED" }),
      data: expect.objectContaining({ cancellationRefundAmount: booking.total }),
    }));
  });

  it("records a cancelled-while-unpaid reason for PENDING cancellations", async () => {
    tx.booking.findUnique.mockResolvedValue({ ...booking, paymentStatus: "PENDING" });

    await resolveLatePayment(input);

    expect(tx.latePaymentResolution.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ reason: "CANCELLED_WHILE_UNPAID" }),
    });
  });
});
