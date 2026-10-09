// Path: src/app/api/payment/payment.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import crypto from "crypto";

const mocks = vi.hoisted(() => ({
  bookingFindUnique: vi.fn(),
  bookingUpdateMany: vi.fn(),
  subscriptionFindUnique: vi.fn(),
  subscriptionUpdateMany: vi.fn(),
  userUpdate: vi.fn(),
  webhookEvents: new Map<string, {
    id: string;
    bodyHash: string;
    status: string;
    processingStartedAt: Date | null;
    payloadEvidence: string;
  }>(),
  webhookCreateMany: vi.fn(async ({ data }: { data: Array<{
    bodyHash: string;
    payloadEvidence: string;
  }> }) => {
    for (const event of data) {
      if (!mocks.webhookEvents.has(event.bodyHash)) {
        mocks.webhookEvents.set(event.bodyHash, {
          id: event.bodyHash,
          bodyHash: event.bodyHash,
          status: "RECEIVED",
          processingStartedAt: null,
          payloadEvidence: event.payloadEvidence,
        });
      }
    }
    return { count: data.length };
  }),
  webhookFindUnique: vi.fn(async ({ where }: { where: { bodyHash?: string; id?: string } }) => {
    const key = where.bodyHash ?? where.id;
    return key ? mocks.webhookEvents.get(key) ?? null : null;
  }),
  webhookUpdateMany: vi.fn(async ({ where, data }: {
    where: { id: string };
    data: { status?: string; processingStartedAt?: Date | null };
  }) => {
    const event = mocks.webhookEvents.get(where.id);
    if (!event) return { count: 0 };
    if (data.status) event.status = data.status;
    if ("processingStartedAt" in data) event.processingStartedAt = data.processingStartedAt ?? null;
    return { count: 1 };
  }),
  paymentMethods: [
    { value: "safepay", enabled: true },
    { value: "jazzcash", enabled: true },
    { value: "easypaisa", enabled: false },
  ],
}));

vi.stubEnv("JAZZCASH_MERCHANT_ID", "TEST_MERCHANT");
vi.stubEnv("JAZZCASH_PASSWORD", "TEST_PASSWORD");
vi.stubEnv("JAZZCASH_INTEGRITY_SALT", "test_salt_1234");
vi.stubEnv("JAZZCASH_ENV", "sandbox");
vi.stubEnv("SAFEPAY_SECRET", "test_safepay_secret");
vi.stubEnv("SAFEPAY_API_KEY", "sec_test_key");
vi.stubEnv("SAFEPAY_WEBHOOK_SECRET", "test_webhook_secret");
vi.stubEnv("NEXT_PUBLIC_SAFEPAY_ENV", "sandbox");
vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://hostello.pk");

vi.mock("@/lib/db", () => ({
  db: {
    booking: {
      findUnique: mocks.bookingFindUnique,
      update: vi.fn(),
      updateMany: mocks.bookingUpdateMany,
    },
    subscription: {
      findUnique: mocks.subscriptionFindUnique,
      updateMany: mocks.subscriptionUpdateMany,
    },
    user: { update: mocks.userUpdate },
    safepayWebhookEvent: {
      createMany: mocks.webhookCreateMany,
      findUnique: mocks.webhookFindUnique,
      updateMany: mocks.webhookUpdateMany,
    },
    $transaction: vi.fn(async (work: (tx: unknown) => Promise<unknown>) => work({
      subscription: { updateMany: mocks.subscriptionUpdateMany },
      user: { update: mocks.userUpdate },
    })),
  },
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
  escapeHtml: (value: string) => value,
}));
vi.mock("@/lib/email-templates/booking-status", () => ({
  bookingStatusEmail: vi.fn().mockReturnValue({ subject: "test", html: "test" }),
}));
vi.mock("@/lib/app-url", () => ({
  getAppUrl: () => "https://hostello.pk",
  getAppOrigin: () => "https://hostello.pk",
}));
vi.mock("@/lib/gateway-ip-allowlist", () => ({ verifyGatewayIp: vi.fn().mockReturnValue(null) }));
vi.mock("@/lib/jazzcash", () => ({ parseJazzCashCallback: vi.fn() }));
vi.mock("@/lib/notifications", () => ({ createNotification: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/payment-methods", () => ({ PAYMENT_METHODS: mocks.paymentMethods }));

import { GET as callbackGET, POST as callbackPOST } from "@/app/api/payment/callback/route";
import { POST as webhookPOST } from "@/app/api/payment/webhook/route";
import { sendEmail } from "@/lib/email";
import { verifyGatewayIp } from "@/lib/gateway-ip-allowlist";
import { parseJazzCashCallback } from "@/lib/jazzcash";

const BOOKING_ID = "cltest0000000000000000001";
const JAZZCASH_TXN = "T000111222333";
const TRACKER = "track_test_payment";
const WEBHOOK_SECRET = process.env.SAFEPAY_WEBHOOK_SECRET!;

function makeBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: BOOKING_ID,
    total: 12000,
    status: "PENDING",
    paymentStatus: "PENDING",
    paymentMethod: "safepay",
    transactionId: TRACKER,
    checkIn: new Date("2030-01-01T00:00:00.000Z"),
    checkOut: new Date("2030-03-01T00:00:00.000Z"),
    months: 2,
    userId: "user-1",
    user: { name: "Ali Khan", email: "ali@example.com" },
    hostel: {
      name: "Green Valley",
      slug: "green-valley",
      owner: { id: "owner-1", name: "Owner One", email: "owner@example.com" },
    },
    ...overrides,
  };
}

function makeSafepayEvent({
  type = "payment.succeeded",
  amount = 1_200_000,
  orderId = BOOKING_ID,
  tracker = TRACKER,
  currency = "PKR",
  state = "TRACKER_ENDED",
}: {
  type?: string;
  amount?: number;
  orderId?: string;
  tracker?: string;
  currency?: string;
  state?: string;
} = {}) {
  return JSON.stringify({
    token: "evt_test",
    version: "2.0.0",
    merchant_api_key: "sec_test_key",
    type,
    data: {
      tracker,
      state,
      amount,
      currency,
      metadata: { order_id: orderId },
    },
  });
}

function makeJazzCashRequest(bookingId = BOOKING_ID) {
  return new NextRequest(
    `https://hostello.pk/api/payment/callback?provider=jazzcash&bookingId=${bookingId}`,
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "pp_TxnRefNo=T000111222333&pp_ResponseCode=000&pp_Amount=1200000&pp_SecureHash=MOCK",
    },
  );
}

async function safepayRequest(payload: string) {
  const signature = crypto.createHmac("sha512", WEBHOOK_SECRET).update(payload).digest("hex");
  return new NextRequest("https://hostello.pk/api/payment/webhook", {
    method: "POST",
    headers: { "content-type": "application/json", "x-sfpy-signature": signature },
    body: payload,
  });
}

describe("JazzCash callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.paymentMethods[1].enabled = true;
    mocks.bookingFindUnique.mockResolvedValue(makeBooking({ paymentMethod: "jazzcash", transactionId: null }));
    mocks.bookingUpdateMany.mockResolvedValue({ count: 1 });
    vi.mocked(parseJazzCashCallback).mockReturnValue({
      success: true,
      txnRefNo: JAZZCASH_TXN,
      responseCode: "000",
      responseMessage: "Transaction Processed Successfully",
      amount: 12000,
    });
  });

  it("records a matching pending booking and redirects to its real confirmation route", async () => {
    const response = await callbackPOST(makeJazzCashRequest());
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain(`/booking/${BOOKING_ID}/confirmation`);
    expect(mocks.bookingUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ paymentMethod: "jazzcash", paymentStatus: "PENDING", status: "PENDING" }),
      data: expect.objectContaining({
        paymentStatus: "PAID",
        transactionId: JAZZCASH_TXN,
        ownerResponseDueAt: expect.any(Date),
      }),
    }));
    expect(mocks.bookingUpdateMany.mock.calls[0][0].data).not.toHaveProperty("status");
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });

  it("rejects signed-provider callbacks while that payment method is disabled", async () => {
    mocks.paymentMethods[1].enabled = false;

    const response = await callbackPOST(makeJazzCashRequest());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("payment=unavailable");
    expect(parseJazzCashCallback).not.toHaveBeenCalled();
    expect(mocks.bookingFindUnique).not.toHaveBeenCalled();
    expect(mocks.bookingUpdateMany).not.toHaveBeenCalled();
  });

  it("keeps browser GET returns read-only and requires the signed POST callback to settle", async () => {
    const response = await callbackGET(new NextRequest(
      `https://hostello.pk/api/payment/callback?provider=jazzcash&bookingId=${BOOKING_ID}&pp_ResponseCode=000`,
    ));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      `https://hostello.pk/booking/${BOOKING_ID}/payment?payment=pending`,
    );
    expect(parseJazzCashCallback).not.toHaveBeenCalled();
    expect(mocks.bookingFindUnique).not.toHaveBeenCalled();
    expect(mocks.bookingUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects a callback when a configured gateway IP allowlist fails", async () => {
    vi.mocked(verifyGatewayIp).mockReturnValueOnce("Request IP is not allowed");

    const response = await callbackPOST(makeJazzCashRequest());

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      `https://hostello.pk/booking/${BOOKING_ID}/payment?payment=error`,
    );
    expect(parseJazzCashCallback).not.toHaveBeenCalled();
    expect(mocks.bookingFindUnique).not.toHaveBeenCalled();
    expect(mocks.bookingUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects an oversized JazzCash callback before parsing or settling it", async () => {
    const request = new NextRequest(
      `https://hostello.pk/api/payment/callback?provider=jazzcash&bookingId=${BOOKING_ID}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "content-length": String(16 * 1024 + 1),
        },
        body: "pp_TxnRefNo=too-large",
      },
    );

    const response = await callbackPOST(request);

    expect(response.status).toBe(413);
    expect(parseJazzCashCallback).not.toHaveBeenCalled();
    expect(mocks.bookingFindUnique).not.toHaveBeenCalled();
    expect(mocks.bookingUpdateMany).not.toHaveBeenCalled();
  });

  it("does not revive a cancelled booking when a delayed success callback arrives", async () => {
    mocks.bookingFindUnique.mockResolvedValue(makeBooking({
      paymentMethod: "jazzcash",
      transactionId: null,
      status: "CANCELLED",
    }));

    await callbackPOST(makeJazzCashRequest());

    expect(mocks.bookingUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ paymentStatus: "PAID", transactionId: JAZZCASH_TXN }),
    }));
    expect(mocks.bookingUpdateMany.mock.calls[0][0].data).not.toHaveProperty("status");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("does not settle a booking for a different provider", async () => {
    mocks.bookingFindUnique.mockResolvedValue(makeBooking({ paymentMethod: "safepay" }));
    const response = await callbackPOST(makeJazzCashRequest());
    expect(response.headers.get("location")).toContain("payment=error");
    expect(mocks.bookingUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects a bad signature result and an incorrect amount", async () => {
    vi.mocked(parseJazzCashCallback).mockImplementation(() => { throw new Error("bad hash"); });
    await callbackPOST(makeJazzCashRequest());
    expect(mocks.bookingUpdateMany).not.toHaveBeenCalled();

    vi.mocked(parseJazzCashCallback).mockReturnValue({
      success: true,
      txnRefNo: JAZZCASH_TXN,
      responseCode: "000",
      responseMessage: "ok",
      amount: 9000,
    });
    await callbackPOST(makeJazzCashRequest());
    expect(mocks.bookingUpdateMany).not.toHaveBeenCalled();
  });
});

describe("EasyPaisa callback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fails closed because the redirect response has no verifiable signature", async () => {
    const body = new URLSearchParams({
      orderRefNum: BOOKING_ID,
      amount: "12000.00",
      responseCode: "0000",
    }).toString();
    const request = new NextRequest(
      `https://hostello.pk/api/payment/callback?provider=easypaisa&bookingId=${BOOKING_ID}`,
      { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body },
    );
    const response = await callbackPOST(request);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("payment=unavailable");
    expect(mocks.bookingFindUnique).not.toHaveBeenCalled();
    expect(mocks.bookingUpdateMany).not.toHaveBeenCalled();
  });
});

describe("Safepay webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.webhookEvents.clear();
    vi.mocked(sendEmail).mockResolvedValue({ success: true } as any);
    mocks.bookingFindUnique.mockResolvedValue(makeBooking());
    mocks.bookingUpdateMany.mockResolvedValue({ count: 1 });
    mocks.subscriptionFindUnique.mockResolvedValue({
      id: "sub-1",
      userId: "owner-1",
      status: "PENDING",
      paymentRef: TRACKER,
    });
    mocks.subscriptionUpdateMany.mockResolvedValue({ count: 1 });
    mocks.userUpdate.mockResolvedValue({});
  });

  it("confirms a v2 payment.succeeded event after verifying SHA-512 and paisa amount", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const response = await webhookPOST(await safepayRequest(makeSafepayEvent()));
    expect(response.status).toBe(200);
    expect(mocks.bookingUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: BOOKING_ID,
        paymentMethod: "safepay",
        paymentStatus: "PENDING",
        transactionId: TRACKER,
      }),
      data: expect.objectContaining({
        paymentStatus: "PAID",
        transactionId: TRACKER,
        ownerResponseDueAt: expect.any(Date),
      }),
    }));
    expect(mocks.bookingUpdateMany.mock.calls[0][0].data).not.toHaveProperty("status");
    expect(sendEmail).toHaveBeenCalledTimes(2);
    const paymentEvent = log.mock.calls
      .map(([line]) => JSON.parse(String(line)))
      .find((record) => record.event === "booking.payment_confirmed");
    expect(paymentEvent).toMatchObject({
      severity: "INFO",
      request_id: expect.any(String),
      attributes: { booking_id: BOOKING_ID, booking_status: "PENDING" },
    });
    expect(JSON.stringify(paymentEvent)).not.toContain(TRACKER);
    expect(JSON.stringify(paymentEvent)).not.toContain("ali@example.com");
    log.mockRestore();
  });

  it("logs email-provider rejections without recipient or tracker data", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(sendEmail).mockResolvedValue({ success: false, error: "Email delivery failed." } as any);

    const response = await webhookPOST(await safepayRequest(makeSafepayEvent()));
    await vi.waitFor(() => expect(log).toHaveBeenCalled());

    const events = log.mock.calls
      .map(([line]) => JSON.parse(String(line)))
      .filter((record) => record.event === "notification.dispatch_failed");
    expect(response.status).toBe(200);
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: "ERROR",
        attributes: {
          notification_type: "BOOKING_REQUEST_EMAIL_TO_OWNER",
          booking_id: BOOKING_ID,
          reason: "provider_rejected",
        },
      }),
      expect.objectContaining({
        severity: "ERROR",
        attributes: {
          notification_type: "BOOKING_REQUEST_EMAIL_TO_STUDENT",
          booking_id: BOOKING_ID,
          reason: "provider_rejected",
        },
      }),
    ]));
    expect(JSON.stringify(events)).not.toContain("ali@example.com");
    expect(JSON.stringify(events)).not.toContain(TRACKER);
    log.mockRestore();
  });

  it("rejects missing and invalid webhook signatures", async () => {
    const payload = makeSafepayEvent();
    const missing = await webhookPOST(new NextRequest("https://hostello.pk/api/payment/webhook", {
      method: "POST", headers: { "content-type": "application/json" }, body: payload,
    }));
    const invalid = await webhookPOST(new NextRequest("https://hostello.pk/api/payment/webhook", {
      method: "POST", headers: { "content-type": "application/json", "x-sfpy-signature": "ab".repeat(64) }, body: payload,
    }));
    expect(missing.status).toBe(401);
    expect(invalid.status).toBe(401);
    expect(mocks.bookingUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects tampered amount, wrong currency, and mismatched tracker", async () => {
    const tampered = await webhookPOST(await safepayRequest(makeSafepayEvent({ amount: 1_200_001 })));
    const wrongCurrency = await webhookPOST(await safepayRequest(makeSafepayEvent({ currency: "USD" })));
    const wrongTracker = await webhookPOST(await safepayRequest(makeSafepayEvent({ tracker: "track_other" })));
    expect(tampered.status).toBe(400);
    expect(wrongCurrency.status).toBe(400);
    expect(wrongTracker.status).toBe(409);
    expect(mocks.bookingUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects malformed success events and non-terminal tracker states", async () => {
    const missingOrder = JSON.stringify({
      type: "payment.succeeded",
      merchant_api_key: "sec_test_key",
      data: { tracker: TRACKER, state: "TRACKER_ENDED", amount: 1_200_000, currency: "PKR", metadata: {} },
    });
    const noTerminalState = makeSafepayEvent({ state: "TRACKER_STARTED" });
    const first = await webhookPOST(await safepayRequest(missingOrder));
    const second = await webhookPOST(await safepayRequest(noTerminalState));
    expect(first.status).toBe(400);
    expect(second.status).toBe(400);
    expect(mocks.bookingUpdateMany).not.toHaveBeenCalled();
  });

  it("records a late payment against a cancelled booking without confirming it", async () => {
    mocks.bookingFindUnique.mockResolvedValue(makeBooking({ status: "CANCELLED" }));
    const response = await webhookPOST(await safepayRequest(makeSafepayEvent()));
    expect(response.status).toBe(200);
    expect(mocks.bookingUpdateMany.mock.calls[0][0].data).toMatchObject({ paymentStatus: "PAID", transactionId: TRACKER });
    expect(mocks.bookingUpdateMany.mock.calls[0][0].data).not.toHaveProperty("status");
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("does not change a refunded booking after a late payment event", async () => {
    mocks.bookingFindUnique.mockResolvedValue(makeBooking({
      status: "CANCELLED",
      paymentStatus: "REFUNDED",
    }));
    const response = await webhookPOST(await safepayRequest(makeSafepayEvent()));
    expect(response.status).toBe(409);
    expect(mocks.bookingUpdateMany).not.toHaveBeenCalled();
  });

  it("marks the matching pending tracker failed so a fresh checkout can be created", async () => {
    const payload = makeSafepayEvent({ type: "payment.failed", state: "TRACKER_ENROLLED" });
    const response = await webhookPOST(await safepayRequest(payload));
    expect(response.status).toBe(200);
    expect(mocks.bookingUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ paymentStatus: "PENDING", transactionId: TRACKER }),
      data: { paymentStatus: "FAILED", transactionId: TRACKER },
    }));
  });

  it("rejects a successful Safepay event for a booking assigned to another provider", async () => {
    mocks.bookingFindUnique.mockResolvedValue(makeBooking({ paymentMethod: "jazzcash" }));

    const response = await webhookPOST(await safepayRequest(makeSafepayEvent()));

    expect(response.status).toBe(409);
    expect(mocks.bookingUpdateMany).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("ignores a failed Safepay event for a booking assigned to another provider", async () => {
    mocks.bookingFindUnique.mockResolvedValue(makeBooking({
      paymentMethod: "jazzcash",
      transactionId: null,
    }));

    const response = await webhookPOST(await safepayRequest(
      makeSafepayEvent({ type: "payment.failed" }),
    ));

    expect(response.status).toBe(200);
    expect(mocks.bookingUpdateMany).not.toHaveBeenCalled();
  });

  it("accepts a legacy booking without a payment method as Safepay's default", async () => {
    mocks.bookingFindUnique.mockResolvedValue(makeBooking({ paymentMethod: null }));

    const response = await webhookPOST(await safepayRequest(makeSafepayEvent()));

    expect(response.status).toBe(200);
    expect(mocks.bookingUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ paymentMethod: null }),
    }));
  });

  it("ignores a stale payment.failed event for an older tracker", async () => {
    mocks.bookingFindUnique.mockResolvedValue(makeBooking({ transactionId: "track_current" }));
    const response = await webhookPOST(await safepayRequest(makeSafepayEvent({ type: "payment.failed" })));
    expect(response.status).toBe(200);
    expect(mocks.bookingUpdateMany).not.toHaveBeenCalled();
  });

  it("does not reprocess the same successful tracker or silently accept a second charge", async () => {
    mocks.bookingFindUnique.mockResolvedValue(makeBooking({ paymentStatus: "PAID", status: "CONFIRMED" }));
    const duplicate = await webhookPOST(await safepayRequest(makeSafepayEvent()));
    expect(duplicate.status).toBe(200);
    expect(mocks.bookingUpdateMany).not.toHaveBeenCalled();

    mocks.bookingFindUnique.mockResolvedValue(makeBooking({
      paymentStatus: "PAID",
      status: "CONFIRMED",
      transactionId: "track_first_charge",
    }));
    const secondCharge = await webhookPOST(await safepayRequest(makeSafepayEvent({ tracker: "track_second_charge" })));
    expect(secondCharge.status).toBe(409);
    expect(mocks.bookingUpdateMany).not.toHaveBeenCalled();
  });

  it("activates a pending Pro upgrade only when the recorded tracker and price match", async () => {
    const payload = makeSafepayEvent({ amount: 300_000, orderId: "sub_sub-1" });
    const response = await webhookPOST(await safepayRequest(payload));
    expect(response.status).toBe(200);
    expect(mocks.subscriptionUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "sub-1", status: "PENDING", paymentRef: TRACKER },
    }));
    expect(mocks.userUpdate).toHaveBeenCalledWith({ where: { id: "owner-1" }, data: { plan: "PRO" } });
  });

  it("does not activate a subscription with the wrong amount or tracker", async () => {
    const wrongAmount = await webhookPOST(await safepayRequest(
      makeSafepayEvent({ amount: 299_900, orderId: "sub_sub-1" }),
    ));
    mocks.subscriptionFindUnique.mockResolvedValue({
      id: "sub-1",
      userId: "owner-1",
      status: "PENDING",
      paymentRef: "track_another",
    });
    const wrongTracker = await webhookPOST(await safepayRequest(
      makeSafepayEvent({ amount: 300_000, orderId: "sub_sub-1" }),
    ));
    expect(wrongAmount.status).toBe(400);
    expect(wrongTracker.status).toBe(409);
    expect(mocks.subscriptionUpdateMany).not.toHaveBeenCalled();
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it("treats an already-active subscription with the same tracker as an idempotent retry", async () => {
    mocks.subscriptionFindUnique.mockResolvedValue({
      id: "sub-1",
      userId: "owner-1",
      status: "ACTIVE",
      paymentRef: TRACKER,
    });
    const response = await webhookPOST(await safepayRequest(
      makeSafepayEvent({ amount: 300_000, orderId: "sub_sub-1" }),
    ));
    expect(response.status).toBe(200);
    expect(mocks.subscriptionUpdateMany).not.toHaveBeenCalled();
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it("ignores unrelated signed events and rejects unknown bookings", async () => {
    const ignored = await webhookPOST(await safepayRequest(JSON.stringify({
      type: "payment.refunded",
      merchant_api_key: "sec_test_key",
      data: {},
    })));
    expect(ignored.status).toBe(200);
    mocks.bookingFindUnique.mockResolvedValue(null);
    const missing = await webhookPOST(await safepayRequest(makeSafepayEvent()));
    expect(missing.status).toBe(404);
  });
});
