import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createMany: vi.fn(),
  deleteMany: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  sendEmail: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: { paymentEmailOutbox: {
    createMany: mocks.createMany,
    deleteMany: mocks.deleteMany,
    findMany: mocks.findMany,
    findUnique: mocks.findUnique,
    updateMany: mocks.updateMany,
  } },
}));
vi.mock("@/lib/email", () => ({ sendEmail: mocks.sendEmail, escapeHtml: (value: string) => value }));

import {
  drainPaymentEmailOutbox,
  enqueuePaymentConfirmationEmails,
  PAYMENT_EMAIL_FAILED_RETENTION_MS,
  PAYMENT_EMAIL_SUCCESS_RETENTION_MS,
} from "./payment-email-outbox";

const NOW = new Date("2026-11-09T12:00:00.000Z");
const BOOKING_ID = "clbooking0000000000000000001";
const OUTBOX_ID = "cloutbox00000000000000000001";
const KEY = `payment-confirmation:${BOOKING_ID}:owner`;

function item(overrides: Record<string, unknown> = {}) {
  return {
    id: OUTBOX_ID,
    recipientUserId: "owner-1",
    bookingId: BOOKING_ID,
    template: "BOOKING_REQUEST_EMAIL_TO_OWNER",
    idempotencyKey: KEY,
    recipient: { id: "owner-1", name: "Owner", email: "owner@example.test" },
    booking: {
      id: BOOKING_ID,
      userId: "student-1",
      status: "PENDING",
      paymentStatus: "PAID",
      checkIn: new Date("2027-01-31T12:34:56.789Z"),
      checkOut: new Date("2027-02-28T12:34:56.789Z"),
      months: 1,
      total: 30000,
      paymentMethod: "safepay",
      user: { id: "student-1", name: "Student", email: "student@example.test" },
      hostel: {
        name: "Hostel A",
        slug: "hostel-a",
        ownerId: "owner-1",
        owner: { id: "owner-1", name: "Owner", email: "owner@example.test" },
      },
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createMany.mockResolvedValue({ count: 2 });
  mocks.deleteMany.mockResolvedValue({ count: 0 });
  mocks.findMany.mockResolvedValue([{ id: OUTBOX_ID, attemptCount: 0 }]);
  mocks.findUnique.mockResolvedValue(item());
  mocks.updateMany.mockResolvedValue({ count: 1 });
  mocks.sendEmail.mockResolvedValue({ success: true, id: "provider-response-must-not-persist" });
});

describe("payment confirmation email outbox", () => {
  it("transactionally enqueues only typed references and idempotency keys", async () => {
    const tx = { paymentEmailOutbox: { createMany: mocks.createMany } } as any;
    await enqueuePaymentConfirmationEmails(tx, {
      bookingId: BOOKING_ID,
      studentUserId: "student-1",
      ownerUserId: "owner-1",
    }, NOW);

    expect(mocks.createMany).toHaveBeenCalledWith({
      skipDuplicates: true,
      data: [
        {
          bookingId: BOOKING_ID,
          recipientUserId: "owner-1",
          template: "BOOKING_REQUEST_EMAIL_TO_OWNER",
          idempotencyKey: `payment-confirmation:${BOOKING_ID}:owner`,
          expiresAt: new Date(NOW.getTime() + PAYMENT_EMAIL_FAILED_RETENTION_MS),
        },
        {
          bookingId: BOOKING_ID,
          recipientUserId: "student-1",
          template: "BOOKING_REQUEST_EMAIL_TO_STUDENT",
          idempotencyKey: `payment-confirmation:${BOOKING_ID}:student`,
          expiresAt: new Date(NOW.getTime() + PAYMENT_EMAIL_FAILED_RETENTION_MS),
        },
      ],
    });
    expect(JSON.stringify(mocks.createMany.mock.calls[0][0])).not.toMatch(/@|subject|html|provider/i);
  });

  it("renders from current DB state and sets provider idempotency and 24-hour success expiry", async () => {
    const result = await drainPaymentEmailOutbox(NOW);
    const writes = mocks.updateMany.mock.calls.map(([call]) => call.data);
    expect(result).toMatchObject({ scanned: 1, sent: 1, retried: 0, dead: 0 });
    expect(mocks.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: "owner@example.test",
      subject: expect.any(String),
      html: expect.stringContaining("Hostel A"),
    }), { idempotencyKey: KEY, suppressErrorLogs: true });
    expect(writes[0]).toMatchObject({
      status: "PROCESSING",
      attemptCount: { increment: 1 },
      lastAttemptAt: NOW,
    });
    expect(writes[1]).toMatchObject({
      status: "SENT",
      sentAt: NOW,
      expiresAt: new Date(NOW.getTime() + PAYMENT_EMAIL_SUCCESS_RETENTION_MS),
    });
    expect(JSON.stringify(writes)).not.toContain("provider-response-must-not-persist");
    expect(JSON.stringify(writes)).not.toContain("owner@example.test");
  });

  it("stores only a bounded safe code on provider failure and retries the same idempotency key", async () => {
    mocks.sendEmail.mockResolvedValue({ success: false, error: "raw provider response with secret" });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await drainPaymentEmailOutbox(NOW);
    const failureWrite = mocks.updateMany.mock.calls[1][0].data;

    expect(result.retried).toBe(1);
    expect(failureWrite).toMatchObject({
      status: "RETRY",
      lastErrorCode: "PROVIDER_FAILURE",
      nextAttemptAt: new Date(NOW.getTime() + 60_000),
    });
    expect(JSON.stringify(failureWrite)).not.toContain("raw provider response");
    expect(log).not.toHaveBeenCalled();
    expect(mocks.sendEmail.mock.calls[0][1].idempotencyKey).toBe(KEY);
    log.mockRestore();
  });

  it("bounds failed-record retention at 30 days after the final failed attempt", async () => {
    mocks.findMany.mockResolvedValue([{ id: OUTBOX_ID, attemptCount: 7 }]);
    mocks.sendEmail.mockResolvedValue({ success: false, error: "provider details" });

    const result = await drainPaymentEmailOutbox(NOW);
    const failureWrite = mocks.updateMany.mock.calls[1][0].data;

    expect(result.dead).toBe(1);
    expect(failureWrite).toMatchObject({
      status: "DEAD",
      lastErrorCode: "PROVIDER_FAILURE",
      expiresAt: new Date(NOW.getTime() + PAYMENT_EMAIL_FAILED_RETENTION_MS),
    });
  });

  it("deletes any expired row, including abandoned pending or retry records", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 3 });
    mocks.findMany.mockResolvedValue([]);
    const result = await drainPaymentEmailOutbox(NOW);

    expect(result.deleted).toBe(3);
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lte: NOW } },
    });
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ expiresAt: { gt: NOW } }),
    }));
    expect(PAYMENT_EMAIL_SUCCESS_RETENTION_MS).toBe(24 * 60 * 60 * 1000);
    expect(PAYMENT_EMAIL_FAILED_RETENTION_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("does not send stale events to recipients no longer associated with the booking", async () => {
    mocks.findUnique.mockResolvedValue(item({ recipientUserId: "former-owner", recipient: { id: "former-owner", name: "Former", email: "former@example.test" } }));
    const result = await drainPaymentEmailOutbox(NOW);

    expect(result.retried).toBe(1);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
    expect(mocks.updateMany.mock.calls[1][0].data.lastErrorCode).toBe("RECIPIENT_MISMATCH");
  });
});
