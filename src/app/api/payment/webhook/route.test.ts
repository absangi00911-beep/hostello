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
    subscription: { findUnique: vi.fn(), updateMany: vi.fn() },
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
vi.mock("@/lib/email-templates/booking", () => ({
  bookingNotificationEmail: vi.fn(() => ({ to: "owner@example.com", subject: "Booking", html: "<p>Booking</p>" })),
  bookingConfirmationEmail: vi.fn(() => ({ to: "student@example.com", subject: "Booking", html: "<p>Booking</p>" })),
}));
vi.mock("@/lib/notifications", () => ({ createNotification: vi.fn() }));
vi.mock("@/lib/email-templates/booking-status", () => ({ bookingStatusEmail: vi.fn() }));
vi.mock("@/lib/verify-upstash", () => ({ verifyUpstashRequest: vi.fn() }));
vi.mock("@/lib/late-payment-resolution", () => ({ resolveLatePayment: vi.fn() }));

import { POST } from "./route";
import { verifyWebhookSignature } from "@/lib/safepay";
import { db } from "@/lib/db";
import { verifyUpstashRequest } from "@/lib/verify-upstash";
import { sendEmail } from "@/lib/email";
import { resolveLatePayment } from "@/lib/late-payment-resolution";

function request(body: string, headers: Record<string, string> = {}) {
  return new NextRequest("https://hostello.test/api/payment/webhook", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("SAFEPAY_API_KEY", "sec_test");
  vi.stubEnv("QSTASH_TOKEN", "");
  vi.mocked(verifyWebhookSignature).mockResolvedValue(true);
  vi.mocked(sendEmail).mockResolvedValue({ success: true } as Awaited<ReturnType<typeof sendEmail>>);
  vi.mocked(resolveLatePayment).mockResolvedValue({ outcome: "REINSTATED" });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

const booking = {
  id: "booking_1",
  userId: "student_1",
  status: "PENDING",
  paymentStatus: "PENDING",
  paymentMethod: "safepay",
  transactionId: null,
  total: 25_000,
  checkIn: new Date("2027-01-01T00:00:00.000Z"),
  checkOut: new Date("2027-02-01T00:00:00.000Z"),
  months: 1,
  user: { name: "Ayesha", email: "student@example.com" },
  hostel: {
    name: "Garden Hostel",
    slug: "garden-hostel",
    owner: { id: "owner_1", name: "Owner", email: "owner@example.com" },
  },
};

function successEvent(overrides: {
  bookingStatus?: string;
  paymentStatus?: string;
  transactionId?: string | null;
  tracker?: string;
} = {}) {
  const event = {
    type: "payment.succeeded",
    merchant_api_key: "sec_test",
    data: {
      tracker: overrides.tracker ?? "tracker_1",
      state: "TRACKER_ENDED",
      amount: 2_500_000,
      currency: "PKR",
      metadata: { order_id: "booking_1" },
    },
  };
  const storedPayload = JSON.stringify({
    type: event.type,
    merchant_api_key: "[REDACTED]",
    data: event.data,
  });
  vi.mocked(db.safepayWebhookEvent.findUnique).mockResolvedValue({
    id: "event_1",
    status: "RECEIVED",
    processingStartedAt: null,
    payloadEvidence: storedPayload,
  } as never);
  vi.mocked(db.safepayWebhookEvent.updateMany).mockResolvedValue({ count: 1 } as never);
  return { event };
}

function subscriptionSuccessEvent(tracker: string) {
  const event = {
    type: "payment.succeeded",
    merchant_api_key: "sec_test",
    data: {
      tracker,
      state: "TRACKER_ENDED",
      amount: 300_000,
      currency: "PKR",
      metadata: { order_id: "sub_subscription_1" },
    },
  };
  vi.mocked(db.safepayWebhookEvent.findUnique).mockResolvedValue({
    id: "event_subscription_1",
    status: "RECEIVED",
    processingStartedAt: null,
    payloadEvidence: JSON.stringify(event),
  } as never);
  vi.mocked(db.safepayWebhookEvent.updateMany).mockResolvedValue({ count: 1 } as never);
  return event;
}

function subscriptionFailedEvent(tracker: string) {
  const event = {
    type: "payment.failed",
    merchant_api_key: "sec_test",
    data: {
      tracker,
      amount: 300_000,
      currency: "PKR",
      metadata: { order_id: "sub_subscription_1" },
    },
  };
  vi.mocked(db.safepayWebhookEvent.createMany).mockResolvedValue({ count: 1 } as never);
  vi.mocked(db.safepayWebhookEvent.findUnique).mockResolvedValue({
    id: `event_${tracker}`,
    status: "RECEIVED",
    processingStartedAt: null,
    payloadEvidence: JSON.stringify(event),
  } as never);
  vi.mocked(db.safepayWebhookEvent.updateMany).mockResolvedValue({ count: 1 } as never);
  return event;
}

function transactionWithPaymentResult(count: number) {
  const tx = {
    booking: { updateMany: vi.fn().mockResolvedValue({ count }) },
    notification: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
    paymentEmailOutbox: { createMany: vi.fn().mockResolvedValue({ count: 2 }) },
  };
  vi.mocked(db.$transaction).mockImplementation(((callback: (client: typeof db) => Promise<unknown>) =>
    callback(tx as unknown as typeof db)) as typeof db.$transaction);
  return tx;
}

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

  it.each([
    ["abandoned checkout", "CANCELLED", "FAILED"],
    ["cancelled while unpaid", "CANCELLED", "PENDING"],
  ])("routes %s successes through late-payment resolution", async (_label, status, paymentStatus) => {
    const { event } = successEvent({ bookingStatus: status, paymentStatus, transactionId: "tracker_1" });
    vi.mocked(db.booking.findUnique).mockResolvedValue({
      ...booking,
      status,
      paymentStatus,
      transactionId: "tracker_1",
    } as never);

    const response = await POST(request(JSON.stringify(event), { "x-sfpy-signature": "valid" }));

    expect(response.status).toBe(200);
    expect(resolveLatePayment).toHaveBeenCalledWith({
      bookingId: "booking_1",
      sourceWebhookEventId: "event_1",
      providerTracker: "tracker_1",
      amountMinorUnits: 2_500_000,
      currency: "PKR",
    });
  });

  it("accepts a successful payment after a failed event on the same live booking tracker", async () => {
    const { event } = successEvent({
      bookingStatus: "PENDING",
      paymentStatus: "FAILED",
      transactionId: "tracker_1",
    });
    const tx = transactionWithPaymentResult(1);
    vi.mocked(db.booking.findUnique).mockResolvedValue({
      ...booking,
      status: "PENDING",
      paymentStatus: "FAILED",
      transactionId: "tracker_1",
    } as never);

    const response = await POST(request(JSON.stringify(event), { "x-sfpy-signature": "valid" }));

    expect(response.status).toBe(200);
    expect(tx.booking.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ paymentStatus: "FAILED", transactionId: "tracker_1" }),
      data: expect.objectContaining({ paymentStatus: "PAID", transactionId: "tracker_1" }),
    }));
    expect(resolveLatePayment).not.toHaveBeenCalled();
  });

  it("re-reads a lost normal-payment update and resolves a cancellation race", async () => {
    const { event } = successEvent();
    transactionWithPaymentResult(0);
    vi.mocked(db.booking.findUnique)
      .mockResolvedValueOnce(booking as never)
      .mockResolvedValueOnce({
        ...booking,
        status: "CANCELLED",
        paymentStatus: "FAILED",
        transactionId: null,
      } as never);

    const response = await POST(request(JSON.stringify(event), { "x-sfpy-signature": "valid" }));

    expect(response.status).toBe(200);
    expect(resolveLatePayment).toHaveBeenCalledWith(expect.objectContaining({
      bookingId: "booking_1",
      sourceWebhookEventId: "event_1",
      providerTracker: "tracker_1",
    }));
  });

  it("acknowledges an identical completed delivery without resolving it again", async () => {
    const { event } = successEvent();
    vi.mocked(db.safepayWebhookEvent.findUnique).mockResolvedValue({
      id: "event_1",
      status: "PROCESSED",
      processingStartedAt: null,
    } as never);

    const response = await POST(request(JSON.stringify(event), { "x-sfpy-signature": "valid" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ duplicate: true });
    expect(db.booking.findUnique).not.toHaveBeenCalled();
    expect(resolveLatePayment).not.toHaveBeenCalled();
  });

  it("asks QStash to retry a concurrent delivery while the first claim is active", async () => {
    const { event } = successEvent();
    const storedPayload = JSON.stringify(event);
    let releaseFirstRead!: () => void;
    let markFirstReadEntered!: () => void;
    const firstReadReleased = new Promise<void>((resolve) => {
      releaseFirstRead = resolve;
    });
    const firstReadEntered = new Promise<void>((resolve) => {
      markFirstReadEntered = resolve;
    });
    let readCount = 0;
    vi.mocked(verifyUpstashRequest).mockResolvedValue(undefined);
    vi.mocked(db.safepayWebhookEvent.updateMany)
      .mockResolvedValueOnce({ count: 1 } as never)
      .mockResolvedValueOnce({ count: 0 } as never)
      .mockResolvedValueOnce({ count: 1 } as never);
    vi.mocked(db.safepayWebhookEvent.findUnique).mockImplementation((async () => {
      readCount++;
      if (readCount === 1) {
        markFirstReadEntered();
        await firstReadReleased;
        return { payloadEvidence: storedPayload } as never;
      }
      return { status: "PROCESSING", processingStartedAt: new Date() } as never;
    }) as never);
    vi.mocked(db.booking.findUnique).mockResolvedValue(booking as never);
    transactionWithPaymentResult(1);

    const firstRequest = POST(request('{"eventId":"event_1"}', { "upstash-signature": "valid" }));
    await firstReadEntered;
    const concurrentResponse = await POST(request('{"eventId":"event_1"}', { "upstash-signature": "valid" }));

    expect(concurrentResponse.status).toBe(503);
    expect(db.booking.findUnique).not.toHaveBeenCalled();
    releaseFirstRead();
    expect((await firstRequest).status).toBe(200);
  });

  it("releases a failed initial Pro tracker so an explicit retry can start", async () => {
    const event = subscriptionFailedEvent("failed-initial-tracker");
    vi.mocked(db.subscription.findUnique).mockResolvedValue({
      id: "subscription_1", status: "PENDING", paymentRef: "failed-initial-tracker", renewalPaymentRef: null,
    } as never);
    vi.mocked(db.subscription.updateMany).mockResolvedValue({ count: 1 } as never);

    const response = await POST(request(JSON.stringify(event), { "x-sfpy-signature": "valid" }));

    expect(response.status).toBe(200);
    expect(db.subscription.updateMany).toHaveBeenCalledWith({
      where: { id: "subscription_1", status: "PENDING", paymentRef: "failed-initial-tracker" },
      data: { status: "CANCELLED", paymentRef: null },
    });
  });

  it("clears a failed renewal reference while preserving the active Pro period", async () => {
    const event = subscriptionFailedEvent("failed-renewal-tracker");
    vi.mocked(db.subscription.findUnique).mockResolvedValue({
      id: "subscription_1", status: "ACTIVE", paymentRef: "previous-tracker", renewalPaymentRef: "failed-renewal-tracker",
    } as never);
    vi.mocked(db.subscription.updateMany).mockResolvedValue({ count: 1 } as never);

    const response = await POST(request(JSON.stringify(event), { "x-sfpy-signature": "valid" }));

    expect(response.status).toBe(200);
    expect(db.subscription.updateMany).toHaveBeenCalledWith({
      where: { id: "subscription_1", status: "ACTIVE", renewalPaymentRef: "failed-renewal-tracker" },
      data: { renewalPaymentRef: null },
    });
  });

  it("renews from the recorded month-end during grace with a clamped UTC month", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-02-05T13:15:00.000Z"));
    const event = subscriptionSuccessEvent("renewal-tracker");
    const endDate = new Date("2030-01-31T13:15:00.000Z");
    vi.mocked(db.subscription.findUnique).mockResolvedValue({
      id: "subscription_1",
      userId: "owner_1",
      status: "ACTIVE",
      paymentRef: "previous-tracker",
      renewalPaymentRef: "renewal-tracker",
      endDate,
    } as never);
    const tx = {
      subscription: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      user: { update: vi.fn() },
    };
    vi.mocked(db.$transaction).mockImplementation((async (callback: (client: typeof db) => Promise<unknown>) =>
      callback(tx as unknown as typeof db)) as typeof db.$transaction);

    const response = await POST(request(JSON.stringify(event), { "x-sfpy-signature": "valid" }));

    expect(response.status).toBe(200);
    expect(tx.subscription.updateMany).toHaveBeenCalledWith({
      where: {
        id: "subscription_1",
        status: "ACTIVE",
        renewalPaymentRef: "renewal-tracker",
        endDate,
      },
      data: {
        paymentRef: "renewal-tracker",
        renewalPaymentRef: null,
        startDate: endDate,
        endDate: new Date("2030-02-28T13:15:00.000Z"),
      },
    });
    expect(tx.user.update).toHaveBeenCalledWith({ where: { id: "owner_1" }, data: { plan: "PRO" } });
  });

  it("starts a new monthly term at receipt time for a renewal callback after grace", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-02-07T13:15:00.000Z"));
    const event = subscriptionSuccessEvent("late-renewal-tracker");
    const endDate = new Date("2030-01-31T13:15:00.000Z");
    vi.mocked(db.subscription.findUnique).mockResolvedValue({
      id: "subscription_1",
      userId: "owner_1",
      status: "ACTIVE",
      paymentRef: "previous-tracker",
      renewalPaymentRef: "late-renewal-tracker",
      endDate,
    } as never);
    const tx = {
      subscription: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      user: { update: vi.fn() },
    };
    vi.mocked(db.$transaction).mockImplementation((async (callback: (client: typeof db) => Promise<unknown>) =>
      callback(tx as unknown as typeof db)) as typeof db.$transaction);

    const response = await POST(request(JSON.stringify(event), { "x-sfpy-signature": "valid" }));

    expect(response.status).toBe(200);
    expect(tx.subscription.updateMany).toHaveBeenCalledWith({
      where: {
        id: "subscription_1",
        status: "ACTIVE",
        renewalPaymentRef: "late-renewal-tracker",
        endDate,
      },
      data: {
        paymentRef: "late-renewal-tracker",
        renewalPaymentRef: null,
        startDate: new Date("2030-02-07T13:15:00.000Z"),
        endDate: new Date("2030-03-07T13:15:00.000Z"),
      },
    });
  });

  it("acknowledges a duplicate renewal callback without extending the term twice", async () => {
    const event = subscriptionSuccessEvent("already-paid-renewal");
    vi.mocked(db.subscription.findUnique).mockResolvedValue({
      id: "subscription_1",
      userId: "owner_1",
      status: "ACTIVE",
      paymentRef: "already-paid-renewal",
      renewalPaymentRef: null,
      endDate: new Date("2030-03-07T13:15:00.000Z"),
    } as never);

    const response = await POST(request(JSON.stringify(event), { "x-sfpy-signature": "valid" }));

    expect(response.status).toBe(200);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

});
