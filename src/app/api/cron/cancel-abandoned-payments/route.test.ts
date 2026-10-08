import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  db: {
    booking: { findMany: vi.fn() },
    room: { updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/verify-upstash", () => ({
  verifyUpstashRequest: vi.fn(),
}));

vi.mock("@/lib/cron-utils", () => ({
  runCronJob: vi.fn(async (_name: string, handler: () => Promise<unknown>) => {
    return Response.json(await handler());
  }),
}));

import { POST } from "@/app/api/cron/cancel-abandoned-payments/route";
import { db } from "@/lib/db";
import { verifyUpstashRequest } from "@/lib/verify-upstash";

const tx = {
  booking: { updateMany: vi.fn() },
  room: { updateMany: vi.fn() },
};

function request() {
  return new NextRequest("https://hostello.test/api/cron/cancel-abandoned-payments", {
    method: "POST",
  });
}

describe("POST /api/cron/cancel-abandoned-payments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyUpstashRequest).mockResolvedValue(true);
    vi.mocked(db.booking.findMany).mockResolvedValue([]);
    tx.booking.updateMany.mockReset().mockResolvedValue({ count: 1 });
    tx.room.updateMany.mockReset().mockResolvedValue({ count: 1 });
    vi.mocked(db.$transaction).mockImplementation(((callback: (client: typeof db) => Promise<unknown>) => {
      return callback(tx as unknown as typeof db);
    }) as typeof db.$transaction);
  });

  it("requires the signed cron request before reading bookings", async () => {
    vi.mocked(verifyUpstashRequest).mockRejectedValueOnce(new Error("bad signature"));

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(db.booking.findMany).not.toHaveBeenCalled();
  });

  it("rechecks payment state before cancelling and restores only successfully released rooms", async () => {
    vi.mocked(db.booking.findMany).mockResolvedValue([
      { id: "booking-paid", roomId: "room-paid" },
      { id: "booking-abandoned", roomId: "room-abandoned" },
    ] as Awaited<ReturnType<typeof db.booking.findMany>>);
    tx.booking.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ count: 1, roomsRestored: 1 });
    expect(tx.booking.updateMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: expect.objectContaining({
        id: "booking-paid",
        status: "PENDING",
        paymentStatus: "PENDING",
      }),
      data: { status: "CANCELLED", paymentStatus: "FAILED" },
    }));
    expect(tx.room.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.room.updateMany).toHaveBeenCalledWith({
      where: { id: "room-abandoned" },
      data: { available: { increment: 1 }, version: { increment: 1 } },
    });
    expect(db.booking.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
  });
});
