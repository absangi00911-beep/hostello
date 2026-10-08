import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  db: {
    booking: { findUnique: vi.fn(), updateMany: vi.fn() },
    subscription: { findUnique: vi.fn() },
    user: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/safepay", () => ({
  toSafepayMinorUnits: vi.fn((amount: number) => amount * 100),
  verifyWebhookSignature: vi.fn(),
}));

vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/notifications", () => ({ createNotification: vi.fn() }));
vi.mock("@/lib/email-templates/booking-status", () => ({ bookingStatusEmail: vi.fn() }));

import { POST } from "./route";
import { verifyWebhookSignature } from "@/lib/safepay";
import { db } from "@/lib/db";

function request(body: string, headers: Record<string, string> = {}) {
  return new NextRequest("https://hostello.test/api/payment/webhook", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllEnvs());

describe("POST /api/payment/webhook", () => {
  it("rejects an oversized raw body before signature verification or database access", async () => {
    const res = await POST(request("{}", { "content-length": String(64 * 1024 + 1) }));
    const body = await res.json();

    expect(res.status).toBe(413);
    expect(body.error).toBe("Request body is too large.");
    expect(verifyWebhookSignature).not.toHaveBeenCalled();
    expect(db.booking.findUnique).not.toHaveBeenCalled();
  });

  it("verifies the exact bounded raw text before parsing an event", async () => {
    const rawBody = '{"type":"payment.succeeded","data":{"tracker":"trk_1"}}';
    vi.mocked(verifyWebhookSignature).mockResolvedValue(false);

    const res = await POST(request(rawBody, { "x-sfpy-signature": "invalid" }));

    expect(res.status).toBe(401);
    expect(verifyWebhookSignature).toHaveBeenCalledWith(rawBody, "invalid");
    expect(db.booking.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an oversized order ID in an otherwise valid signed event before querying", async () => {
    vi.stubEnv("SAFEPAY_API_KEY", "sec_test");
    vi.mocked(verifyWebhookSignature).mockResolvedValue(true);
    const rawBody = JSON.stringify({
      type: "payment.failed",
      merchant_api_key: "sec_test",
      data: {
        tracker: "track_4f7d7e2d-ee05-44e3-81b7-6f6f2cca9727",
        metadata: { order_id: "x".repeat(129) },
      },
    });

    const response = await POST(request(rawBody, { "x-sfpy-signature": "valid" }));

    expect(response.status).toBe(400);
    expect(verifyWebhookSignature).toHaveBeenCalledWith(rawBody, "valid");
    expect(db.booking.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an oversized provider tracker before querying", async () => {
    vi.stubEnv("SAFEPAY_API_KEY", "sec_test");
    vi.mocked(verifyWebhookSignature).mockResolvedValue(true);
    const rawBody = JSON.stringify({
      type: "payment.failed",
      merchant_api_key: "sec_test",
      data: {
        tracker: `track_${"x".repeat(256)}`,
        metadata: { order_id: "booking_1" },
      },
    });

    const response = await POST(request(rawBody, { "x-sfpy-signature": "valid" }));

    expect(response.status).toBe(400);
    expect(db.booking.findUnique).not.toHaveBeenCalled();
  });
});
