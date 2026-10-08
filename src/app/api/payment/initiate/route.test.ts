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

vi.mock("@/lib/app-url", () => ({
  getAppOrigin: vi.fn(() => "https://hostello.test"),
}));

import { POST } from "@/app/api/payment/initiate/route";
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

  it("uses the mobile app scheme for mobile Safepay returns", async () => {
    const req = new NextRequest("https://hostello.test/api/payment/initiate", {
      method: "POST",
      headers: { "x-client": "mobile" },
      body: JSON.stringify({ bookingId: "booking-1" }),
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        redirectPath: "hostello://payment/return?bookingId=booking-1",
        cancelPath: "hostello://payment/return?bookingId=booking-1",
        source: "mobile",
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
      user: { name: "Ali", email: "ali@example.com" },
    } as Awaited<ReturnType<typeof db.booking.findUnique>>);

    const req = new NextRequest("https://hostello.test/api/payment/initiate", {
      method: "POST",
      headers: { "x-client": "mobile" },
      body: JSON.stringify({ bookingId: "booking-1" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(createCheckoutLink).not.toHaveBeenCalled();
    expect(createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      bookingId: "booking-1",
      source: "mobile",
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
});
