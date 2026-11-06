import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  updateMany: vi.fn(),
  findUnique: vi.fn(),
  deleteMany: vi.fn(),
  transaction: vi.fn(),
  verify: vi.fn(),
  processRefund: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    booking: {
      findMany: mocks.findMany,
      updateMany: mocks.updateMany,
      findUnique: mocks.findUnique,
    },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/verify-upstash", () => ({ verifyUpstashRequest: mocks.verify }));
vi.mock("@/lib/cron-utils", () => ({
  runCronJob: vi.fn(async (_name: string, handler: () => Promise<unknown>) =>
    Response.json(await handler()),
  ),
}));
vi.mock("@/lib/refunds", () => ({ processRefund: mocks.processRefund }));
vi.mock("@/lib/availability-alerts", () => ({
  reevaluateAvailabilityAlertsForHostel: vi.fn().mockResolvedValue(0),
}));

import { POST } from "./route";

const tx = {
  $queryRaw: vi.fn().mockResolvedValue([]),
  booking: { updateMany: vi.fn() },
  seatHold: { deleteMany: vi.fn() },
};

function request() {
  return new NextRequest("https://hostello.test/api/cron/expire-unanswered-bookings", {
    method: "POST",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.verify.mockResolvedValue(true);
  mocks.findMany
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([{
      id: "booking_expired",
      hostelId: "hostel_1",
      roomId: "room_1",
      total: 25_000,
      guests: 1,
    }]);
  tx.booking.updateMany.mockReset().mockResolvedValue({ count: 1 });
  tx.seatHold.deleteMany.mockReset().mockResolvedValue({ count: 1 });
  mocks.transaction.mockImplementation(async (callback: any) => callback(tx));
  mocks.processRefund.mockResolvedValue({ automatic: true });
});

describe("POST /api/cron/expire-unanswered-bookings", () => {
  it("releases a paid booking's holds atomically after the expiry transition", async () => {
    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.count).toBe(1);
    expect(tx.booking.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: "booking_expired",
        status: "PENDING",
        paymentStatus: "PAID",
      }),
      data: { status: "CANCELLED", cancellationRefundAmount: 25_000 },
    }));
    expect(tx.seatHold.deleteMany).toHaveBeenCalledWith({
      where: { bookingId: "booking_expired" },
    });
  });

  it("does not release holds if another state transition won the race", async () => {
    tx.booking.updateMany.mockResolvedValueOnce({ count: 0 });

    await POST(request());

    expect(tx.seatHold.deleteMany).not.toHaveBeenCalled();
  });
});
