import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    booking: { findMany: vi.fn() },
    safepayWebhookEvent: { findMany: vi.fn() },
  },
}));
vi.mock("@/lib/refunds", () => ({ processRefund: vi.fn() }));

import { db } from "@/lib/db";
import { processRefund } from "@/lib/refunds";
import { sweepCancelledRefunds } from "./refund-sweeper";

const candidates = [
  {
    id: "booking-1",
    total: 25_000,
    cancellationRefundAmount: 25_000,
    refundedAmount: 0,
    refundState: "NONE",
    transactionId: "tracker-1",
  },
  {
    id: "booking-zero",
    total: 10_000,
    cancellationRefundAmount: 0,
    refundedAmount: 0,
    refundState: "NONE",
    transactionId: "tracker-zero",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(db.booking.findMany).mockResolvedValue(candidates as never);
  vi.mocked(db.safepayWebhookEvent.findMany).mockResolvedValue([] as never);
  vi.mocked(processRefund).mockResolvedValue({ automatic: true } as never);
});

describe("sweepCancelledRefunds", () => {
  it("only sends positive remaining cancelled refunds through the existing claim flow", async () => {
    const result = await sweepCancelledRefunds();

    expect(result).toEqual({
      scanned: 2,
      attempted: 1,
      refunded: 1,
      unconfirmed: 0,
      skipped: 1,
    });
    expect(db.booking.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        status: "CANCELLED",
        paymentStatus: { in: ["PAID", "PARTIALLY_REFUNDED"] },
        refundState: { in: ["NONE", "PARTIALLY_REFUNDED"] },
      }),
    }));
    expect(processRefund).toHaveBeenCalledOnce();
    expect(processRefund).toHaveBeenCalledWith("booking-1", "system:cancelled-refund-sweeper");
  });

  it("does not refund a booking while its successful webhook is being evaluated", async () => {
    vi.mocked(db.safepayWebhookEvent.findMany).mockResolvedValueOnce([
      { merchantOrderId: "booking-1", tracker: "tracker-1" },
    ] as never);

    const result = await sweepCancelledRefunds();

    expect(result).toMatchObject({ attempted: 0, refunded: 0, skipped: 2 });
    expect(db.safepayWebhookEvent.findMany).toHaveBeenCalledWith({
      where: {
        status: { in: ["RECEIVED", "QUEUED", "PROCESSING", "RETRYABLE", "RECONCILIATION_REQUIRED"] },
        eventType: "payment.succeeded",
        merchantOrderId: { in: ["booking-1", "booking-zero"] },
        tracker: { in: ["tracker-1", "tracker-zero"] },
      },
      select: { merchantOrderId: true, tracker: true },
    });
    expect(processRefund).not.toHaveBeenCalled();
  });

  it("continues after one claim is unavailable or unconfirmed", async () => {
    vi.mocked(db.booking.findMany).mockResolvedValue([
      { ...candidates[0], id: "booking-1" },
      { ...candidates[0], id: "booking-2" },
    ] as never);
    vi.mocked(processRefund)
      .mockRejectedValueOnce(new Error("claim lost"))
      .mockResolvedValueOnce({ automatic: false } as never);

    const result = await sweepCancelledRefunds();

    expect(result).toEqual({
      scanned: 2,
      attempted: 2,
      refunded: 0,
      unconfirmed: 2,
      skipped: 0,
    });
    expect(processRefund).toHaveBeenCalledTimes(2);
  });
});
