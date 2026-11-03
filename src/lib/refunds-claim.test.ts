// Path: src/lib/refunds-claim.test.ts
//
// B-001: the refund claim must be an atomic compare-and-set on the refunded
// amount. The mocks in refunds.test.ts return canned updateMany results, which
// cannot show a stale-read race, so this file uses a small stateful fake that
// really evaluates the claim's `where` against the stored row. JS runs each
// updateMany call to completion, which mirrors a single-row UPDATE ... WHERE in
// Postgres (READ COMMITTED re-checks the predicate against the latest row
// version), so the predicate semantics are what is under test here.

import { describe, it, expect, vi, beforeEach } from "vitest";

type Row = Record<string, unknown>;

const store = vi.hoisted(() => ({
  row: null as Record<string, unknown> | null,
  events: [] as Array<Record<string, unknown>>,
}));

function matches(row: Row, where: Row): boolean {
  return Object.entries(where).every(([key, cond]) => {
    const value = row[key];
    if (cond !== null && typeof cond === "object" && "in" in (cond as Row)) {
      return ((cond as { in: unknown[] }).in).includes(value);
    }
    return value === cond;
  });
}

function applyData(row: Row, data: Row) {
  for (const [key, val] of Object.entries(data)) {
    if (val !== null && typeof val === "object" && "increment" in (val as Row)) {
      row[key] = (row[key] as number) + (val as { increment: number }).increment;
    } else {
      row[key] = val;
    }
  }
}

vi.mock("@/lib/db", () => {
  const booking = {
    findUnique: vi.fn(async () => (store.row ? structuredClone(store.row) : null)),
    findUniqueOrThrow: vi.fn(async () => structuredClone(store.row)),
    updateMany: vi.fn(async ({ where, data }: { where: Row; data: Row }) => {
      if (!store.row || !matches(store.row, where)) return { count: 0 };
      applyData(store.row, data);
      return { count: 1 };
    }),
  };
  const refundAuditEvent = {
    create: vi.fn(async ({ data }: { data: Row }) => {
      store.events.push({ ...data });
      return data;
    }),
    findFirst: vi.fn(async ({ where }: { where: Row }) => {
      const found = [...store.events].reverse().find((e) => matches(e, where));
      return found ? { ...found, createdAt: new Date() } : null;
    }),
  };
  const tx = { booking, refundAuditEvent };
  return {
    db: {
      booking,
      refundAuditEvent,
      $transaction: vi.fn(async <T>(cb: (t: typeof tx) => Promise<T>) => cb(tx)),
    },
  };
});

vi.mock("@/lib/safepay", () => ({ refundPayment: vi.fn() }));
vi.mock("@/lib/notifications", () => ({ createNotification: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/email-templates/booking-status", () => ({
  bookingRefundedEmail: vi.fn().mockReturnValue({ to: "s@test.com", subject: "x", html: "x" }),
}));
vi.mock("@/lib/background", () => ({
  runAfterResponse: vi.fn(async (_event: string, task: () => Promise<unknown>) => {
    await task();
  }),
}));

import { processRefund, RefundServiceError } from "./refunds";
import { db } from "./db";
import { refundPayment } from "./safepay";

const BOOKING_ID = "bkg_0000000000000000000001";
const ADMIN_ID = "usr_admin_0000000000000001";

function seed(overrides: Row = {}) {
  store.events = [];
  store.row = {
    id: BOOKING_ID,
    userId: "usr_student_0000000000001",
    total: 45000,
    status: "CANCELLED",
    paymentStatus: "PAID",
    paymentMethod: "safepay",
    transactionId: "sfpy_txn_12345",
    cancellationRefundAmount: 20000, // partial: the policy approves 20,000 of 45,000
    refundedAmount: 0,
    refundState: "NONE",
    refundedAt: null,
    refundedBy: null,
    user: { name: "Ayesha Khan", email: "ayesha@test.com" },
    hostel: { name: "Green View Hostel" },
    ...overrides,
  };
}

function providerOk() {
  vi.mocked(refundPayment).mockResolvedValue({
    success: true,
    state: "TRACKER_PARTIAL_REFUND",
    raw: { data: { tracker: { state: "TRACKER_PARTIAL_REFUND" } } },
  } as never);
}

function deferred() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("processRefund claim (B-001)", () => {
  it("(a) stale read: a request that read before another partial refund finished sends no second refund", async () => {
    seed();
    providerOk();

    // Request B reads the booking (refundedAmount 0, state NONE) and then stalls
    // before it reaches the claim. Request A runs to completion in the meantime.
    const gate = deferred();
    const realFindUnique = vi.mocked(db.booking.findUnique).getMockImplementation()!;
    vi.mocked(db.booking.findUnique).mockImplementationOnce((async (...args: never[]) => {
      const staleSnapshot = await (realFindUnique as (...a: never[]) => Promise<Row>)(...args);
      await gate.promise;
      return staleSnapshot;
    }) as never);

    const requestB = processRefund(BOOKING_ID, ADMIN_ID).then(
      (value) => ({ ok: true as const, value }),
      (error: unknown) => ({ ok: false as const, error }),
    );
    const requestA = await processRefund(BOOKING_ID, ADMIN_ID);
    expect(requestA.automatic).toBe(true);
    expect(store.row).toMatchObject({ refundedAmount: 20000, refundState: "PARTIALLY_REFUNDED" });

    gate.release();
    const outcomeB = await requestB;

    expect(refundPayment).toHaveBeenCalledTimes(1);
    expect(outcomeB.ok).toBe(false);
    if (!outcomeB.ok) {
      expect(outcomeB.error).toBeInstanceOf(RefundServiceError);
      expect((outcomeB.error as RefundServiceError).statusCode).toBe(409);
    }
    expect(store.row?.refundedAmount).toBe(20000);
    expect(store.events.filter((e) => e.type === "AUTOMATIC_REQUESTED")).toHaveLength(1);
  });

  it("(a2) two overlapping requests started together: exactly one reaches the provider", async () => {
    seed();
    providerOk();

    const results = await Promise.allSettled([
      processRefund(BOOKING_ID, ADMIN_ID),
      processRefund(BOOKING_ID, ADMIN_ID),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    expect(refundPayment).toHaveBeenCalledTimes(1);
    expect(store.row?.refundedAmount).toBe(20000);
  });

  it("(b) sequential partials within the approved limit both succeed", async () => {
    seed();
    providerOk();

    await processRefund(BOOKING_ID, ADMIN_ID);
    expect(refundPayment).toHaveBeenLastCalledWith({ transactionId: "sfpy_txn_12345", amount: 20000 });

    // Policy later approves a larger amount; only the remaining 10,000 is refundable.
    (store.row as Row).cancellationRefundAmount = 30000;
    await processRefund(BOOKING_ID, ADMIN_ID);

    expect(refundPayment).toHaveBeenCalledTimes(2);
    expect(refundPayment).toHaveBeenLastCalledWith({ transactionId: "sfpy_txn_12345", amount: 10000 });
    expect(store.row).toMatchObject({ refundedAmount: 30000, paymentStatus: "PARTIALLY_REFUNDED" });
  });

  it("(c) a request that would exceed the approved amount is rejected before the provider", async () => {
    seed({ refundedAmount: 20000, refundState: "PARTIALLY_REFUNDED", paymentStatus: "PARTIALLY_REFUNDED" });
    providerOk();

    await expect(processRefund(BOOKING_ID, ADMIN_ID)).rejects.toThrow("No refund amount remains");
    expect(refundPayment).not.toHaveBeenCalled();
    expect(store.row?.refundedAmount).toBe(20000);
  });

  it("(c2) an approved amount above the total is capped at the total", async () => {
    seed({ cancellationRefundAmount: 99999 });
    providerOk();

    await processRefund(BOOKING_ID, ADMIN_ID);

    expect(refundPayment).toHaveBeenCalledWith({ transactionId: "sfpy_txn_12345", amount: 45000 });
    expect(store.row).toMatchObject({ refundedAmount: 45000, paymentStatus: "REFUNDED", refundState: "REFUNDED" });
  });

  it("(d) a full refund still works and blocks a repeat", async () => {
    seed({ cancellationRefundAmount: null });
    providerOk();

    const result = await processRefund(BOOKING_ID, ADMIN_ID);

    expect(result.automatic).toBe(true);
    expect(refundPayment).toHaveBeenCalledWith({ transactionId: "sfpy_txn_12345", amount: 45000 });
    expect(store.row).toMatchObject({ refundedAmount: 45000, paymentStatus: "REFUNDED", refundState: "REFUNDED" });

    await expect(processRefund(BOOKING_ID, ADMIN_ID)).rejects.toBeInstanceOf(RefundServiceError);
    expect(refundPayment).toHaveBeenCalledTimes(1);
  });

  it("(e) the provider is not called and no request event is written when the claim fails", async () => {
    seed();
    providerOk();
    // Another actor changes the booking after our read but before our claim.
    const realFindUnique = vi.mocked(db.booking.findUnique).getMockImplementation()!;
    vi.mocked(db.booking.findUnique).mockImplementationOnce((async (...args: never[]) => {
      const snapshot = await (realFindUnique as (...a: never[]) => Promise<Row>)(...args);
      (store.row as Row).refundedAmount = 20000;
      (store.row as Row).refundState = "PARTIALLY_REFUNDED";
      (store.row as Row).paymentStatus = "PARTIALLY_REFUNDED";
      return snapshot;
    }) as never);

    await expect(processRefund(BOOKING_ID, ADMIN_ID)).rejects.toBeInstanceOf(RefundServiceError);

    expect(refundPayment).not.toHaveBeenCalled();
    expect(store.events).toHaveLength(0);
    expect(store.row?.refundedAmount).toBe(20000);
  });
});
