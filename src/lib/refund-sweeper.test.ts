import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    booking: {
      findMany: vi.fn(),
      // Prisma field references, used to compare two columns of the same row.
      fields: { total: { __ref: "total" }, cancellationRefundAmount: { __ref: "cancellationRefundAmount" } },
    },
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

  // Evaluates the subset of Prisma `where` syntax the sweeper uses, so the test
  // checks what the query would actually select, not just its shape.
  type Row = Record<string, unknown>;
  function matches(row: Row, where: Record<string, unknown>): boolean {
    return Object.entries(where).every(([key, condition]) => {
      if (key === "OR") return (condition as Record<string, unknown>[]).some((branch) => matches(row, branch));
      const value = row[key];
      if (condition === null || typeof condition !== "object") return value === condition;
      return Object.entries(condition as Record<string, unknown>).every(([op, operand]) => {
        const rhs = operand && typeof operand === "object" && "__ref" in operand
          ? row[(operand as { __ref: string }).__ref]
          : operand;
        if (op === "in") return (rhs as unknown[]).includes(value);
        if (op === "gt") return (value as number) > (rhs as number);
        if (op === "lt") return (value as number) < (rhs as number);
        throw new Error(`unsupported operator ${op}`);
      });
    });
  }

  it("does not keep re-selecting bookings whose approved refund is already fully paid out", async () => {
    const base = { status: "CANCELLED", paymentStatus: "PARTIALLY_REFUNDED", refundState: "PARTIALLY_REFUNDED", transactionId: "t" };
    const rows: Row[] = [
      // 50% policy, approved amount fully refunded: finished, must never be selected.
      { id: "done-partial", total: 10_000, cancellationRefundAmount: 5_000, refundedAmount: 5_000, ...base },
      // 50% policy, nothing refunded yet: still owed.
      { id: "owed-partial", total: 10_000, cancellationRefundAmount: 5_000, refundedAmount: 0, ...base, paymentStatus: "PAID", refundState: "NONE" },
      // Full refund owed.
      { id: "owed-full", total: 10_000, cancellationRefundAmount: null, refundedAmount: 0, ...base, paymentStatus: "PAID", refundState: "NONE" },
      // Policy gives no refund.
      { id: "no-refund", total: 10_000, cancellationRefundAmount: 0, refundedAmount: 0, ...base, paymentStatus: "PAID", refundState: "NONE" },
      // Partially refunded but part of the approved amount is still owed.
      { id: "owed-remainder", total: 10_000, cancellationRefundAmount: 8_000, refundedAmount: 3_000, ...base },
    ];

    await sweepCancelledRefunds();

    const where = vi.mocked(db.booking.findMany).mock.calls[0][0]!.where as Record<string, unknown>;
    expect(rows.filter((row) => matches(row, where)).map((row) => row.id).sort())
      .toEqual(["owed-full", "owed-partial", "owed-remainder"]);
  });
});
