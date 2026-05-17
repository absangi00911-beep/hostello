// Path: src/app/api/payment/payment.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import crypto from "crypto";

// ── Env vars — must be set before any module imports ─────────────────────────
// Use vi.stubEnv so values are restored between test files
vi.stubEnv("JAZZCASH_MERCHANT_ID",    "TEST_MERCHANT");
vi.stubEnv("JAZZCASH_PASSWORD",       "TEST_PASSWORD");
vi.stubEnv("JAZZCASH_INTEGRITY_SALT", "test_salt_1234");
vi.stubEnv("JAZZCASH_ENV",            "sandbox");
vi.stubEnv("EASYPAISA_STORE_ID",      "TEST_STORE");
vi.stubEnv("EASYPAISA_HASH_KEY",      "1234567890123456");
vi.stubEnv("EASYPAISA_ENV",           "sandbox");
vi.stubEnv("SAFEPAY_SECRET_KEY",      "test_safepay_secret");
vi.stubEnv("SAFEPAY_WEBHOOK_SECRET",  "test_webhook_secret");
vi.stubEnv("SAFEPAY_ENV",             "sandbox");
vi.stubEnv("NEXT_PUBLIC_APP_URL",     "https://hostello.pk");

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
    booking: {
      findUnique: vi.fn(),
      update:     vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/email-templates/booking-status", () => ({
  bookingStatusEmail: vi.fn().mockReturnValue({ subject: "test", html: "test" }),
}));

vi.mock("@/lib/app-url", () => ({
  getAppUrl: () => "https://hostello.pk",
}));

vi.mock("@/lib/gateway-ip-allowlist", () => ({
  verifyGatewayIp: vi.fn().mockReturnValue(null), // null = allowed
}));

// Mock parseJazzCashCallback directly — the real impl reads JAZZCASH_INTEGRITY_SALT
// at module init time (before vi.stubEnv takes effect). We control its return value
// per-test instead, keeping tests independent from gateway crypto internals.
vi.mock("@/lib/jazzcash", () => ({
  parseJazzCashCallback: vi.fn(),
  createJazzCashSession: vi.fn(),
}));

// ── Imports ───────────────────────────────────────────────────────────────────
import { POST as callbackPOST, GET as callbackGET } from "@/app/api/payment/callback/route";
import { POST as webhookPOST } from "@/app/api/payment/webhook/route";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BOOKING_ID = "cltest0000000000000000001";
const TXN_ID     = "T000111222333";

function makeBooking(overrides: Record<string, unknown> = {}) {
  return {
    id:            BOOKING_ID,
    total:         12000,
    status:        "PENDING",
    paymentStatus: "UNPAID",
    transactionId: null,
    user:   { name: "Ali Khan",     email: "ali@example.com" },
    hostel: { name: "Green Valley", slug:  "green-valley" },
    ...overrides,
  };
}

// ── JazzCash helpers ──────────────────────────────────────────────────────────
// We mock parseJazzCashCallback, so the request body is irrelevant for these tests.
// We only need a valid NextRequest shape with the right query params.

import { parseJazzCashCallback } from "@/lib/jazzcash";

function jazzCashRequest(bookingId = BOOKING_ID): NextRequest {
  return new NextRequest(
    `https://hostello.pk/api/payment/callback?provider=jazzcash&bookingId=${bookingId}`,
    {
      method:  "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body:    "pp_TxnRefNo=T000111222333&pp_ResponseCode=000&pp_Amount=1200000&pp_SecureHash=MOCK",
    },
  );
}

// ── Safepay webhook helpers ───────────────────────────────────────────────────

const WEBHOOK_SECRET = process.env.SAFEPAY_WEBHOOK_SECRET!;

async function signSafepayPayload(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function makeSafepayEvent(amount = 12000, orderId = BOOKING_ID) {
  return JSON.stringify({
    type: "payment:success",
    data: {
      order_id:       orderId,
      transaction_id: TXN_ID,
      amount,
    },
  });
}

async function safepayRequest(payload: string): Promise<NextRequest> {
  const sig = await signSafepayPayload(payload);
  return new NextRequest("https://hostello.pk/api/payment/webhook", {
    method:  "POST",
    headers: {
      "content-type":    "application/json",
      "x-sfpy-signature": sig,
    },
    body: payload,
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// JAZZCASH CALLBACK
// ═════════════════════════════════════════════════════════════════════════════

describe("JazzCash callback — /api/payment/callback?provider=jazzcash", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.booking.findUnique).mockResolvedValue(makeBooking() as any);
    vi.mocked(db.booking.update).mockResolvedValue(
      makeBooking({ paymentStatus: "PAID", status: "CONFIRMED" }) as any,
    );
    // Default: valid signature, success code, correct amount
    vi.mocked(parseJazzCashCallback).mockReturnValue({
      success:         true,
      txnRefNo:        TXN_ID,
      responseCode:    "000",
      responseMessage: "Transaction Processed Successfully",
      amount:          12000,
    });
  });

  it("confirms booking on valid signature + success code", async () => {
    const req = jazzCashRequest();
    const res = await callbackPOST(req);

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("/payment/success");
    expect(db.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paymentStatus: "PAID", status: "CONFIRMED" }),
      }),
    );
  });

  it("sends confirmation email after successful payment", async () => {
    const req = jazzCashRequest();
    await callbackPOST(req);

    expect(sendEmail).toHaveBeenCalled();
  });

  it("throws on tampered / invalid hash — parseJazzCashCallback throws", async () => {
    vi.mocked(parseJazzCashCallback).mockImplementation(() => {
      throw new Error("JazzCash: secure hash mismatch — possible tampering");
    });

    const req = jazzCashRequest();
    const res = await callbackPOST(req);

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("payment=error");
    expect(db.booking.update).not.toHaveBeenCalled();
  });

  it("redirects to failed URL on non-000 response code", async () => {
    vi.mocked(parseJazzCashCallback).mockReturnValue({
      success:         false,
      txnRefNo:        "",
      responseCode:    "113",
      responseMessage: "Insufficient Funds",
      amount:          12000,
    });

    const req = jazzCashRequest();
    const res = await callbackPOST(req);

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("payment=failed");
    expect(db.booking.update).not.toHaveBeenCalled();
  });

  it("rejects if paid amount differs by more than 1 PKR", async () => {
    vi.mocked(parseJazzCashCallback).mockReturnValue({
      success:         true,
      txnRefNo:        TXN_ID,
      responseCode:    "000",
      responseMessage: "Transaction Processed Successfully",
      amount:          9000, // booking total is 12000
    });

    const req = jazzCashRequest();
    const res = await callbackPOST(req);

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("payment=error");
    expect(db.booking.update).not.toHaveBeenCalled();
  });

  it("is idempotent — skips update if booking already PAID", async () => {
    vi.mocked(db.booking.findUnique).mockResolvedValue(
      makeBooking({ paymentStatus: "PAID", status: "CONFIRMED" }) as any,
    );

    const req = jazzCashRequest();
    const res = await callbackPOST(req);

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("/payment/success");
    expect(db.booking.update).not.toHaveBeenCalled();
  });

  it("redirects to error if bookingId is missing from URL", async () => {
    const req = new NextRequest(
      "https://hostello.pk/api/payment/callback?provider=jazzcash",
      { method: "POST", body: "" },
    );
    const res = await callbackPOST(req);

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("payment=error");
  });

  it("also handles GET callbacks (some sandbox environments)", async () => {
    const req = new NextRequest(
      `https://hostello.pk/api/payment/callback?provider=jazzcash&bookingId=${BOOKING_ID}`,
    );
    const res = await callbackGET(req);

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("/payment/success");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// EASYPAISA CALLBACK
// ═════════════════════════════════════════════════════════════════════════════

describe("EasyPaisa callback — /api/payment/callback?provider=easypaisa", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.booking.findUnique).mockResolvedValue(makeBooking() as any);
    vi.mocked(db.booking.update).mockResolvedValue(
      makeBooking({ paymentStatus: "PAID", status: "CONFIRMED" }) as any,
    );
  });

  function easypaisaRequest(
    overrides: Record<string, string> = {},
    bookingId = BOOKING_ID,
  ): NextRequest {
    const params: Record<string, string> = {
      orderRefNum:   bookingId,
      TransactionID: TXN_ID,
      amount:        "12000.00",
      responseCode:  "0000",
      responseDesc:  "Txn Successful",
      ...overrides,
    };
    const body = new URLSearchParams(params).toString();
    return new NextRequest(
      `https://hostello.pk/api/payment/callback?provider=easypaisa&bookingId=${bookingId}`,
      {
        method:  "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      },
    );
  }

  it("confirms booking on success code 0000 with matching orderRefNum", async () => {
    const req = easypaisaRequest();
    const res = await callbackPOST(req);

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("/payment/success");
    expect(db.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paymentStatus: "PAID", status: "CONFIRMED" }),
      }),
    );
  });

  it("redirects to failed on non-0000 response code", async () => {
    const req = easypaisaRequest({ responseCode: "0001", responseDesc: "Failed" });
    const res = await callbackPOST(req);

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("payment=failed");
    expect(db.booking.update).not.toHaveBeenCalled();
  });

  it("rejects replay attack — orderRefNum does not match bookingId", async () => {
    // Attacker sends a valid EasyPaisa callback for a different booking
    const req = easypaisaRequest({ orderRefNum: "clother000000000000000001" });
    const res = await callbackPOST(req);

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("payment=failed");
    expect(db.booking.update).not.toHaveBeenCalled();
  });

  it("rejects if paid amount differs by more than 1 PKR", async () => {
    const req = easypaisaRequest({ amount: "5000.00" }); // booking is 12000
    const res = await callbackPOST(req);

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("payment=error");
    expect(db.booking.update).not.toHaveBeenCalled();
  });

  it("is idempotent — skips update if booking already PAID", async () => {
    vi.mocked(db.booking.findUnique).mockResolvedValue(
      makeBooking({ paymentStatus: "PAID", status: "CONFIRMED" }) as any,
    );

    const req = easypaisaRequest();
    const res = await callbackPOST(req);

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("/payment/success");
    expect(db.booking.update).not.toHaveBeenCalled();
  });

  it("redirects to error when booking is not found in DB", async () => {
    vi.mocked(db.booking.findUnique).mockResolvedValue(null);

    const req = easypaisaRequest();
    const res = await callbackPOST(req);

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("payment=error");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SAFEPAY WEBHOOK
// ═════════════════════════════════════════════════════════════════════════════

describe("Safepay webhook — /api/payment/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.booking.findUnique).mockResolvedValue(makeBooking() as any);
    vi.mocked(db.booking.updateMany).mockResolvedValue({ count: 1 } as any);
  });

  it("confirms booking on valid signature + payment:success event", async () => {
    const payload = makeSafepayEvent();
    const req     = await safepayRequest(payload);
    const res     = await webhookPOST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    expect(db.booking.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paymentStatus: "PAID", status: "CONFIRMED" }),
      }),
    );
  });

  it("rejects webhook with missing signature header", async () => {
    const payload = makeSafepayEvent();
    const req     = new NextRequest("https://hostello.pk/api/payment/webhook", {
      method:  "POST",
      headers: { "content-type": "application/json" },
      body:    payload,
    });
    const res = await webhookPOST(req);

    expect(res.status).toBe(401);
    expect(db.booking.updateMany).not.toHaveBeenCalled();
  });

  it("rejects webhook with tampered signature", async () => {
    const payload = makeSafepayEvent();
    const req     = new NextRequest("https://hostello.pk/api/payment/webhook", {
      method:  "POST",
      headers: {
        "content-type":     "application/json",
        "x-sfpy-signature": "deadbeef".repeat(8), // wrong signature
      },
      body: payload,
    });
    const res = await webhookPOST(req);

    expect(res.status).toBe(401);
    expect(db.booking.updateMany).not.toHaveBeenCalled();
  });

  it("rejects tampered payload — signature valid but body changed", async () => {
    const payload = makeSafepayEvent();
    const sig     = await signSafepayPayload(payload);

    // Change the amount in the body AFTER signing
    const tamperedPayload = payload.replace('"amount":12000', '"amount":1');

    const req = new NextRequest("https://hostello.pk/api/payment/webhook", {
      method:  "POST",
      headers: {
        "content-type":     "application/json",
        "x-sfpy-signature": sig,
      },
      body: tamperedPayload,
    });
    const res = await webhookPOST(req);

    expect(res.status).toBe(401);
    expect(db.booking.updateMany).not.toHaveBeenCalled();
  });

  it("rejects if paid amount differs by more than 1 PKR", async () => {
    const payload = makeSafepayEvent(9000); // booking total is 12000
    const req     = await safepayRequest(payload);
    const res     = await webhookPOST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("mismatch");
    expect(db.booking.updateMany).not.toHaveBeenCalled();
  });

  it("accepts amount within ±1 PKR tolerance (rounding)", async () => {
    const payload = makeSafepayEvent(11999.5); // 0.5 PKR under — should pass
    const req     = await safepayRequest(payload);
    const res     = await webhookPOST(req);

    expect(res.status).toBe(200);
    expect(db.booking.updateMany).toHaveBeenCalled();
  });

  it("is idempotent — returns 200 if booking already PAID without re-updating", async () => {
    // updateMany returns count: 0 — booking was already PAID
    vi.mocked(db.booking.updateMany).mockResolvedValue({ count: 0 } as any);

    const payload = makeSafepayEvent();
    const req     = await safepayRequest(payload);
    const res     = await webhookPOST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    // email should NOT be sent again
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("returns 404 when booking does not exist", async () => {
    vi.mocked(db.booking.findUnique).mockResolvedValue(null);

    const payload = makeSafepayEvent();
    const req     = await safepayRequest(payload);
    const res     = await webhookPOST(req);

    expect(res.status).toBe(404);
    expect(db.booking.updateMany).not.toHaveBeenCalled();
  });

  it("silently ignores non-payment:success event types", async () => {
    const payload = JSON.stringify({ type: "payment:refund", data: {} });
    const req     = await safepayRequest(payload);
    const res     = await webhookPOST(req);

    expect(res.status).toBe(200);
    expect(db.booking.updateMany).not.toHaveBeenCalled();
  });

  it("returns 400 if amount field is missing from event data", async () => {
    const payload = JSON.stringify({
      type: "payment:success",
      data: { order_id: BOOKING_ID, transaction_id: TXN_ID },
      // amount intentionally omitted
    });
    const req = await safepayRequest(payload);
    const res = await webhookPOST(req);

    expect(res.status).toBe(400);
    expect(db.booking.updateMany).not.toHaveBeenCalled();
  });

  it("returns 400 if order_id is missing", async () => {
    const payload = JSON.stringify({
      type: "payment:success",
      data: { amount: 12000 }, // no order_id
    });
    const req = await safepayRequest(payload);
    const res = await webhookPOST(req);

    expect(res.status).toBe(400);
    expect(db.booking.updateMany).not.toHaveBeenCalled();
  });

  it("sends confirmation email once after successful payment", async () => {
    const payload = makeSafepayEvent();
    const req     = await safepayRequest(payload);
    await webhookPOST(req);

    // Allow micro-task queue to flush fire-and-forget email
    await new Promise((r) => setTimeout(r, 0));

    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
});