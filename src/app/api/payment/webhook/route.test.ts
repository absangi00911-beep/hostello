import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

vi.mock("node:crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:crypto")>();
  return { ...actual, timingSafeEqual: vi.fn(actual.timingSafeEqual) };
});

vi.mock("@/lib/db", () => ({
  db: {
    booking: { findUnique: vi.fn(), updateMany: vi.fn() },
    subscription: { findUnique: vi.fn() },
    user: { update: vi.fn() },
    safepayWebhookEvent: {
      createMany: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
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
vi.mock("@/lib/verify-upstash", () => ({ verifyUpstashRequest: vi.fn() }));

import { POST } from "./route";
import { verifyWebhookSignature } from "@/lib/safepay";
import { db } from "@/lib/db";
import { verifyUpstashRequest } from "@/lib/verify-upstash";

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

  it("rejects an oversized queued event before QStash signature verification", async () => {
    const res = await POST(request("x".repeat(4 * 1024 + 1), { "upstash-signature": "invalid" }));

    expect(res.status).toBe(413);
    expect(verifyUpstashRequest).not.toHaveBeenCalled();
    expect(db.safepayWebhookEvent.findUnique).not.toHaveBeenCalled();
  });

  it("passes the bounded raw queued-event body to QStash verification", async () => {
    const rawBody = '{"eventId":"event_1"}';
    const req = request(rawBody, { "upstash-signature": "invalid" });
    vi.mocked(verifyUpstashRequest).mockRejectedValue(new Error("Request verification failed"));

    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(verifyUpstashRequest).toHaveBeenCalledWith(req, {
      acceptBearerToken: false,
      body: rawBody,
    });
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

  describe("merchant_api_key comparison", () => {
    // An oversized order ID makes the request fail with 400 right after the
    // merchant-key check, so a 400 proves the key matched and a 401 proves it did not,
    // without needing any database mocks.
    const eventWithKey = (merchantKey: unknown) =>
      JSON.stringify({
        type: "payment.failed",
        merchant_api_key: merchantKey,
        data: {
          tracker: "track_4f7d7e2d-ee05-44e3-81b7-6f6f2cca9727",
          metadata: { order_id: "x".repeat(129) },
        },
      });

    const post = (merchantKey: unknown) =>
      POST(request(eventWithKey(merchantKey), { "x-sfpy-signature": "valid" }));

    beforeEach(() => {
      vi.stubEnv("SAFEPAY_API_KEY", "sec_test_key_1234");
      vi.mocked(verifyWebhookSignature).mockResolvedValue(true);
    });

    it("accepts a matching key and continues to event validation", async () => {
      const response = await post("sec_test_key_1234");

      expect(response.status).toBe(400);
      expect((await response.json()).error).toBe("Invalid webhook event.");
    });

    it("rejects a same-length key that differs", async () => {
      const response = await post("sec_test_key_1235");

      expect(response.status).toBe(401);
      expect((await response.json()).error).toBe("Merchant key mismatch.");
      expect(db.booking.findUnique).not.toHaveBeenCalled();
    });

    it("rejects a shorter key with 401 instead of throwing", async () => {
      const response = await post("sec_test");

      expect(response.status).toBe(401);
      expect((await response.json()).error).toBe("Merchant key mismatch.");
    });

    it("rejects a longer key with 401 instead of throwing", async () => {
      const response = await post("sec_test_key_1234_and_more");

      expect(response.status).toBe(401);
      expect((await response.json()).error).toBe("Merchant key mismatch.");
    });

    it("compares the key with timingSafeEqual on equal-length buffers, even for different-length input", async () => {
      await post("sec_test");

      expect(timingSafeEqual).toHaveBeenCalledTimes(1);
      const [a, b] = vi.mocked(timingSafeEqual).mock.calls[0] as [Buffer, Buffer];
      expect(a.length).toBe(b.length);
    });

    it("rejects a missing or non-string key", async () => {
      expect((await post(undefined)).status).toBe(401);
      expect((await post(null)).status).toBe(401);
      expect((await post(1234)).status).toBe(401);
    });

    it("rejects every event when SAFEPAY_API_KEY is not configured", async () => {
      vi.stubEnv("SAFEPAY_API_KEY", "");

      expect((await post("")).status).toBe(401);
      expect((await post("sec_test_key_1234")).status).toBe(401);
    });
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
