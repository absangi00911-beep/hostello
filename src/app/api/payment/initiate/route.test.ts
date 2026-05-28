import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/config", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    booking: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/safepay", () => ({
  createCheckoutSession: vi.fn(),
}));

vi.mock("@/lib/easypaisa", () => ({
  createEasypaisaSession: vi.fn(),
}));

vi.mock("@/lib/app-url", () => ({
  getRequestOrigin: vi.fn(() => "https://hostello.test"),
}));

import { POST } from "@/app/api/payment/initiate/route";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { createCheckoutSession } from "@/lib/safepay";

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
      user: { name: "Ali", email: "ali@example.com" },
    } as Awaited<ReturnType<typeof db.booking.findUnique>>);
    vi.mocked(createCheckoutSession).mockResolvedValue({
      token: "token-1",
      redirectUrl: "https://sandbox.api.getsafepay.com/checkout?token=token-1",
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
        redirectPath: "hostello://payment/return?bookingId=booking-1&status=paid",
        cancelPath: "hostello://payment/return?bookingId=booking-1&status=cancelled",
      }),
    );
  });
});
