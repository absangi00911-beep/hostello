import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    booking: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/safepay", () => ({
  createCheckoutSession: vi.fn(),
  createCheckoutLink: vi.fn(),
}));

vi.mock("@/lib/easypaisa", () => ({
  createEasypaisaSession: vi.fn(),
}));

vi.mock("@/lib/analytics/sink", () => ({
  recordServerEvent: vi.fn(),
}));

vi.mock("@/lib/app-url", () => ({
  getAppOrigin: vi.fn(() => "https://hostello.test"),
}));

import { POST } from "@/app/api/payment/initiate/route";
import { recordServerEvent } from "@/lib/analytics/sink";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { createCheckoutLink, createCheckoutSession } from "@/lib/safepay";

describe("POST /api/payment/initiate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", role: "STUDENT" },
      expires: "2026-06-01T00:00:00.000Z",
    });
    vi.mocked(db.booking.findUnique).mockResolvedValue({
      id: "booking-1",
      userId: "user-1",
      total: 12000,
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentMethod: "safepay",
      transactionId: null,
      cancellationPolicy: "STANDARD",
      user: { name: "Ali", email: "ali@example.com" },
    } as Awaited<ReturnType<typeof db.booking.findUnique>>);
    vi.mocked(db.booking.updateMany).mockResolvedValue({ count: 1 } as any);
    vi.mocked(createCheckoutSession).mockResolvedValue({
      token: "token-1",
      redirectUrl: "https://sandbox.api.getsafepay.com/checkout?token=token-1",
    });
    vi.mocked(createCheckoutLink).mockResolvedValue({
      token: "token-1",
      redirectUrl: "https://sandbox.api.getsafepay.com/embedded/?tracker=token-1",
    });
  });

  it("uses web checkout even when a request identifies a mobile client", async () => {
    const req = new NextRequest("https://hostello.test/api/payment/initiate", {
      method: "POST",
      headers: { "x-client": "mobile" },
      body: JSON.stringify({ bookingId: "booking-1" }),
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        appUrl: "https://hostello.test",
      }),
    );
    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.not.objectContaining({
        redirectPath: expect.any(String),
        cancelPath: expect.any(String),
      }),
    );
    expect(db.booking.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: { paymentStatus: "PENDING", transactionId: "token-1" },
    }));
  });

  it("uses the configured app origin instead of forwarded host headers", async () => {
    const req = new NextRequest("https://hostello.test/api/payment/initiate", {
      method: "POST",
      headers: {
        "x-forwarded-host": "attacker.example",
        "x-forwarded-proto": "https",
      },
      body: JSON.stringify({ bookingId: "booking-1" }),
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({ appUrl: "https://hostello.test" }),
    );
  });

  it("reuses the recorded tracker for a pending booking", async () => {
    vi.mocked(db.booking.findUnique).mockResolvedValue({
      id: "booking-1",
      userId: "user-1",
      total: 12000,
      status: "PENDING",
      paymentStatus: "PENDING",
      paymentMethod: "safepay",
      transactionId: "track_existing",
      cancellationPolicy: "STANDARD",
      user: { name: "Ali", email: "ali@example.com" },
    } as Awaited<ReturnType<typeof db.booking.findUnique>>);

    const req = new NextRequest("https://hostello.test/api/payment/initiate", {
      method: "POST",
      body: JSON.stringify({ bookingId: "booking-1" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(createCheckoutSession).not.toHaveBeenCalled();
    expect(createCheckoutLink).toHaveBeenCalledWith(expect.objectContaining({ token: "track_existing" }));
  });

  it("creates a replacement tracker after a recorded payment failure", async () => {
    vi.mocked(db.booking.findUnique).mockResolvedValue({
      id: "booking-1",
      userId: "user-1",
      total: 12000,
      status: "PENDING",
      paymentStatus: "FAILED",
      paymentMethod: "safepay",
      transactionId: "track_failed",
      cancellationPolicy: "STANDARD",
      user: { name: "Ali", email: "ali@example.com" },
    } as Awaited<ReturnType<typeof db.booking.findUnique>>);

    const req = new NextRequest("https://hostello.test/api/payment/initiate", {
      method: "POST",
      body: JSON.stringify({ bookingId: "booking-1" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(createCheckoutLink).not.toHaveBeenCalled();
    expect(createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      bookingId: "booking-1",
    }));
    expect(db.booking.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: "booking-1",
        paymentStatus: "FAILED",
        transactionId: "track_failed",
      }),
      data: { paymentStatus: "PENDING", transactionId: "token-1" },
    }));
  });

  describe("funnel event", () => {
    const booking = (overrides: Record<string, unknown> = {}) =>
      ({
        id: "booking-1",
        hostelId: "chostel00000000000000001",
        userId: "user-1",
        total: 12000,
        status: "PENDING",
        paymentStatus: "PENDING",
        paymentMethod: "safepay",
        transactionId: null,
        cancellationPolicy: "STANDARD",
        user: { name: "Ali", email: "ali@example.com" },
        ...overrides,
      }) as Awaited<ReturnType<typeof db.booking.findUnique>>;
    const initiate = () =>
      POST(new NextRequest("https://hostello.test/api/payment/initiate", { method: "POST", body: JSON.stringify({ bookingId: "booking-1" }) }));
    const expectedEvent = ["payment_started", { bookingId: "booking-1", hostelId: "chostel00000000000000001" }] as const;

    it("is recorded when a checkout is created", async () => {
      vi.mocked(db.booking.findUnique).mockResolvedValue(booking());
      expect((await initiate()).status).toBe(200);
      expect(recordServerEvent).toHaveBeenCalledTimes(1);
      expect(recordServerEvent).toHaveBeenCalledWith(...expectedEvent);
    });

    it("is recorded when a pending checkout is resumed", async () => {
      vi.mocked(db.booking.findUnique).mockResolvedValue(booking({ transactionId: "track_existing" }));
      expect((await initiate()).status).toBe(200);
      expect(recordServerEvent).toHaveBeenCalledTimes(1);
      expect(recordServerEvent).toHaveBeenCalledWith(...expectedEvent);
    });

    it("is recorded when a failed payment is retried with a new checkout", async () => {
      vi.mocked(db.booking.findUnique).mockResolvedValue(booking({ paymentStatus: "FAILED", transactionId: "track_failed" }));
      expect((await initiate()).status).toBe(200);
      expect(recordServerEvent).toHaveBeenCalledWith(...expectedEvent);
    });

    it("is not recorded when no checkout could be started", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(db.booking.findUnique).mockResolvedValue(booking());
      vi.mocked(createCheckoutSession).mockRejectedValue(new Error("Safepay down"));
      expect((await initiate()).status).toBe(500);

      vi.mocked(db.booking.findUnique).mockResolvedValue(booking({ userId: "someone-else" }));
      expect((await initiate()).status).toBeGreaterThanOrEqual(400);

      vi.mocked(db.booking.findUnique).mockResolvedValue(null);
      expect((await initiate()).status).toBe(404);

      expect(recordServerEvent).not.toHaveBeenCalled();
    });
  });
});
