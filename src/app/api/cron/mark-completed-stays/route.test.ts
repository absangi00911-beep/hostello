import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  db: {
    booking: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/verify-upstash", () => ({
  verifyUpstashRequest: vi.fn(),
}));

vi.mock("@/lib/notifications", () => ({
  sendPushNotification: vi.fn(),
}));

vi.mock("@/lib/cron-utils", () => ({
  runCronJob: vi.fn(async (
    _name: string,
    handler: (context: unknown) => Promise<unknown>,
    context: unknown,
  ) => {
    return Response.json(await handler(context));
  }),
}));

import { POST } from "@/app/api/cron/mark-completed-stays/route";
import { db } from "@/lib/db";
import { sendPushNotification } from "@/lib/notifications";
import { verifyUpstashRequest } from "@/lib/verify-upstash";

const tx = {
  booking: { updateMany: vi.fn() },
  notification: { create: vi.fn() },
};

function request() {
  return new NextRequest("https://hostello.test/api/cron/mark-completed-stays", {
    method: "POST",
  });
}

describe("POST /api/cron/mark-completed-stays", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyUpstashRequest).mockResolvedValue(true);
    vi.mocked(db.booking.findMany).mockResolvedValue([]);
    tx.booking.updateMany.mockReset().mockResolvedValue({ count: 1 });
    tx.notification.create.mockReset().mockResolvedValue({ id: "notification-1" });
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

  it("completes only still-confirmed bookings and creates one notification per transition", async () => {
    vi.mocked(db.booking.findMany).mockResolvedValue([
      {
        id: "booking-raced",
        userId: "user-raced",
        hostelId: "hostel-raced",
        checkOut: new Date("2026-10-01T00:00:00.000Z"),
        hostel: { name: "Raced Hostel" },
      },
      {
        id: "booking-completed",
        userId: "user-1",
        hostelId: "hostel-1",
        checkOut: new Date("2026-10-01T00:00:00.000Z"),
        hostel: { name: "Garden Hostel" },
      },
    ] as Awaited<ReturnType<typeof db.booking.findMany>>);
    tx.booking.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ count: 1, notified: 1 });
    expect(tx.booking.updateMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: expect.objectContaining({ id: "booking-raced", status: "CONFIRMED" }),
      data: { status: "COMPLETED" },
    }));
    expect(tx.notification.create).toHaveBeenCalledTimes(1);
    expect(tx.notification.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: "user-1",
        type: "BOOKING_COMPLETED",
        bookingId: "booking-completed",
      }),
    }));
    expect(sendPushNotification).toHaveBeenCalledTimes(1);
    expect(sendPushNotification).toHaveBeenCalledWith("user-1", expect.objectContaining({
      data: expect.objectContaining({ notificationId: "notification-1" }),
    }), expect.objectContaining({
      notificationType: "BOOKING_COMPLETED",
      logContext: expect.objectContaining({ request_id: expect.any(String) }),
    }));
    expect(db.booking.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
  });
});
