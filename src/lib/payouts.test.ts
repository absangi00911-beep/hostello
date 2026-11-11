// Path: src/lib/payouts.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
    booking: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      aggregate: vi.fn(),
      count: vi.fn(),
    },
    payout: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    payoutAuditEvent: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import {
  getEligibleBookings,
  createPayoutBatch,
  approvePayoutBatch,
  cancelPayoutBatch,
  markPayoutPaid,
  getPendingBalance,
  PAYOUT_READINESS,
} from "./payouts";
import { db } from "../lib/db";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const OWNER_ID = "usr_owner_0000000000000001";
const ADMIN_ID = "usr_admin_0000000000000001";
const PAYOUT_ID = "pay_0000000000000000000001";

function makeOwnerDetails(overrides = {}) {
  return {
    role: "OWNER",
    bankAccountTitle: "Jane Owner",
    bankAccountNumber: "PK00HABB0000000000000000",
    bankName: "HBL",
    ...overrides,
  };
}

function makePayout(overrides = {}) {
  return {
    id: PAYOUT_ID,
    ownerId: OWNER_ID,
    amount: 0,
    status: "PENDING",
    reference: null,
    createdBy: ADMIN_ID,
    paidAt: null,
    paidBy: null,
    approvedAt: null,
    approvedBy: null,
    destinationSnapshot: "encrypted-destination",
    ...overrides,
  };
}

/** Build a transaction mock that executes the callback with the given tx object. */
function mockTransaction(tx: any) {
  const transaction = {
    ...tx,
    payoutAuditEvent: tx.payoutAuditEvent ?? { create: vi.fn() },
    user: tx.user ?? {
      findUnique: vi.fn().mockResolvedValue(makeOwnerDetails()),
    },
  };
  vi.mocked(db.$transaction).mockImplementation(async (cb: any) => cb(transaction));
  return transaction;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("PAYOUT_DESTINATION_ENCRYPTION_KEY", Buffer.alloc(32, 7).toString("base64"));
  vi.mocked(db.$transaction).mockImplementation(async (callback: any) => callback({
    payout: db.payout,
    booking: db.booking,
    payoutAuditEvent: db.payoutAuditEvent,
  }));
  vi.mocked(db.booking.aggregate).mockResolvedValue({
    _count: { _all: 1 },
    _sum: { total: 45_000 },
  } as any);
  vi.mocked(db.booking.count).mockResolvedValue(1 as any);
});


// ═════════════════════════════════════════════════════════════════════════════
// getEligibleBookings
// ═════════════════════════════════════════════════════════════════════════════

describe("getEligibleBookings", () => {
  it("filters by owner, CONFIRMED/COMPLETED status, PAID, checkOut passed, and unclaimed", async () => {
    vi.mocked(db.booking.findMany).mockResolvedValue([]);

    await getEligibleBookings(OWNER_ID);

    expect(db.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          hostel: { ownerId: OWNER_ID },
          status: { in: ["CONFIRMED", "COMPLETED"] },
          paymentStatus: "PAID",
          payoutId: null,
          checkOut: expect.objectContaining({ lte: expect.any(Date) }),
        }),
      }),
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// createPayoutBatch
// ═════════════════════════════════════════════════════════════════════════════

describe("createPayoutBatch", () => {
  it("throws when there are no eligible bookings", async () => {
    mockTransaction({
      payout: { create: vi.fn().mockResolvedValue(makePayout()) },
      booking: { updateMany: vi.fn().mockResolvedValue({ count: 0 }), aggregate: vi.fn() },
    });

    await expect(createPayoutBatch(OWNER_ID, ADMIN_ID)).rejects.toThrow(
      "No eligible bookings to pay out",
    );
    expect(db.$transaction).toHaveBeenCalled();
  });

  it("creates a payout, claims the eligible bookings, and sums their totals", async () => {
    const tx = mockTransaction({
      payout: {
        create: vi.fn().mockResolvedValue(makePayout()),
        update: vi.fn().mockImplementation(({ data }: any) => makePayout(data)),
      },
      booking: {
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
        aggregate: vi.fn().mockResolvedValue({ _sum: { total: 75000 } }),
      },
    });

    const result = await createPayoutBatch(OWNER_ID, ADMIN_ID);

    expect(tx.payout.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ ownerId: OWNER_ID, createdBy: ADMIN_ID, status: "PENDING" }) }),
    );
    expect(tx.user.findUnique).toHaveBeenCalledWith({
      where: { id: OWNER_ID },
      select: {
        role: true,
        bankAccountTitle: true,
        bankAccountNumber: true,
        bankName: true,
      },
    });
    expect(tx.booking.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        hostel: { ownerId: OWNER_ID },
        status: { in: ["CONFIRMED", "COMPLETED"] },
        paymentStatus: "PAID",
        payoutId: null,
        checkOut: expect.objectContaining({ lte: expect.any(Date) }),
      }),
      data: { payoutId: PAYOUT_ID },
    });
    expect(tx.booking.aggregate).toHaveBeenCalledWith({
      where: { payoutId: PAYOUT_ID },
      _sum: { total: true },
    });
    expect(tx.payout.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { amount: 75000 } }),
    );
    expect(result.amount).toBe(75000);
  });

  it("throws when every eligible booking was already claimed by a concurrent batch", async () => {
    mockTransaction({
      payout: { create: vi.fn().mockResolvedValue(makePayout()) },
      booking: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }), // lost the race
        aggregate: vi.fn(),
      },
    });

    await expect(createPayoutBatch(OWNER_ID, ADMIN_ID)).rejects.toThrow("another batch may have claimed them");
  });

  it.each([
    ["account title", { bankAccountTitle: "   " }],
    ["account number", { bankAccountNumber: null }],
    ["bank name", { bankName: null }],
  ])("does not create or claim a batch when the owner is missing %s", async (_field, missingDetail) => {
    const tx = mockTransaction({
      user: { findUnique: vi.fn().mockResolvedValue(makeOwnerDetails(missingDetail)) },
      payout: { create: vi.fn() },
      booking: { updateMany: vi.fn(), aggregate: vi.fn() },
    });

    await expect(createPayoutBatch(OWNER_ID, ADMIN_ID)).rejects.toThrow("complete all payout bank details");

    expect(tx.payout.create).not.toHaveBeenCalled();
    expect(tx.booking.updateMany).not.toHaveBeenCalled();
  });

  it("rejects a payout target that is not a current owner", async () => {
    const tx = mockTransaction({
      user: { findUnique: vi.fn().mockResolvedValue(makeOwnerDetails({ role: "STUDENT" })) },
      payout: { create: vi.fn() },
      booking: { updateMany: vi.fn(), aggregate: vi.fn() },
    });

    await expect(createPayoutBatch(OWNER_ID, ADMIN_ID)).rejects.toThrow("Payout owner not found");

    expect(tx.payout.create).not.toHaveBeenCalled();
    expect(tx.booking.updateMany).not.toHaveBeenCalled();
  });

  it("sums only bookings actually claimed by this payout batch", async () => {
    const tx = mockTransaction({
      payout: {
        create: vi.fn().mockResolvedValue(makePayout()),
        update: vi.fn().mockImplementation(({ data }: any) => makePayout(data)),
      },
      booking: {
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
        aggregate: vi.fn().mockResolvedValue({ _sum: { total: 30000 } }),
      },
    });

    const result = await createPayoutBatch(OWNER_ID, ADMIN_ID);

    expect(tx.payout.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { amount: 30000 } }),
    );
    expect(result.amount).toBe(30000);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// markPayoutPaid
// Payout approval and settlement transition tests.

describe("approvePayoutBatch", () => {
  it("rejects approval by the creator before attempting a state transition", async () => {
    mockTransaction({ payout: { findUnique: vi.fn().mockResolvedValue(makePayout()) } });

    await expect(approvePayoutBatch(PAYOUT_ID, ADMIN_ID)).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining("different admin"),
    });
    expect(db.payout.updateMany).not.toHaveBeenCalled();
  });

  it("approves with another admin using an atomic creator exclusion and appends the approval event", async () => {
    const approverId = "usr_admin_0000000000000002";
    vi.mocked(db.payout.findUnique).mockResolvedValue(makePayout({ amount: 45_000 }) as any);
    vi.mocked(db.payout.updateMany).mockResolvedValue({ count: 1 } as any);
    vi.mocked(db.payout.findUniqueOrThrow).mockResolvedValue(makePayout({
      amount: 45_000, status: "APPROVED", approvedBy: approverId, approvedAt: new Date(),
    }) as any);

    await approvePayoutBatch(PAYOUT_ID, approverId);

    expect(db.payout.updateMany).toHaveBeenCalledWith({
      where: { id: PAYOUT_ID, status: "PENDING", createdBy: { not: approverId } },
      data: { status: "APPROVED", approvedBy: approverId, approvedAt: expect.any(Date) },
    });
    expect(db.payoutAuditEvent.create).toHaveBeenCalledWith({
      data: { payoutId: PAYOUT_ID, actorId: approverId, action: "APPROVED", amount: 45_000 },
    });
  });

  it("allows only one duplicate/concurrent approval CAS and audit event", async () => {
    const approverId = "usr_admin_0000000000000002";
    vi.mocked(db.payout.findUnique)
      .mockResolvedValueOnce(makePayout({ amount: 45_000 }) as any)
      .mockResolvedValueOnce(makePayout({ amount: 45_000 }) as any)
      .mockResolvedValue(makePayout({ amount: 45_000, status: "APPROVED" }) as any);
    vi.mocked(db.payout.updateMany)
      .mockResolvedValueOnce({ count: 1 } as any)
      .mockResolvedValueOnce({ count: 0 } as any);
    vi.mocked(db.payout.findUniqueOrThrow).mockResolvedValue(makePayout({ status: "APPROVED" }) as any);

    const results = await Promise.allSettled([
      approvePayoutBatch(PAYOUT_ID, approverId),
      approvePayoutBatch(PAYOUT_ID, approverId),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(db.payoutAuditEvent.create).toHaveBeenCalledTimes(1);
  });
});

describe("markPayoutPaid", () => {
  it("rejects an unapproved batch before the settlement-readiness gate", async () => {
    vi.mocked(db.payout.findUnique).mockResolvedValue(makePayout({ amount: 45_000 }) as any);
    await expect(markPayoutPaid(PAYOUT_ID, "usr_admin_0000000000000002", "BANK-REF-1"))
      .rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("must approve") });
    expect(db.$transaction).toHaveBeenCalled();
    expect(db.booking.aggregate).not.toHaveBeenCalled();
    expect(db.payout.updateMany).not.toHaveBeenCalled();
  });

  it("keeps settlement fail-closed even after an independent approval", async () => {
    expect(PAYOUT_READINESS).toMatchObject({
      liveTransfersEnabled: false,
      custodyApproved: false,
      independentApprovalReady: true,
      settlementReconciliationReady: false,
      ready: false,
    });
    vi.mocked(db.payout.findUnique).mockResolvedValue(makePayout({
      amount: 45_000,
      status: "APPROVED",
      approvedBy: "usr_admin_0000000000000002",
      approvedAt: new Date("2026-11-09T10:00:00Z"),
    }) as any);
    await expect(markPayoutPaid(PAYOUT_ID, "usr_admin_0000000000000003", "BANK-REF-1"))
      .rejects.toMatchObject({ statusCode: 503, message: expect.stringContaining("settlement is disabled") });
    expect(db.payout.updateMany).not.toHaveBeenCalled();
    expect(db.booking.aggregate).not.toHaveBeenCalled();
  });

  it("cannot void an approved batch or release its booking claims", async () => {
    vi.mocked(db.payout.updateMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(db.payout.findUnique).mockResolvedValue(makePayout({ status: "APPROVED" }) as any);

    await expect(cancelPayoutBatch(PAYOUT_ID, ADMIN_ID, "approved batch cannot be voided", true))
      .rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("Cannot void a APPROVED payout") });
    expect(db.payout.updateMany).toHaveBeenCalledWith({
      where: { id: PAYOUT_ID, status: "PENDING" },
      data: expect.objectContaining({ status: "CANCELLED" }),
    });
    expect(db.booking.updateMany).not.toHaveBeenCalled();
  });

  it("rejects a blank transfer reference before writing", async () => {
    await expect(markPayoutPaid(PAYOUT_ID, ADMIN_ID, "   ")).rejects.toThrow(
      "Enter the bank or payment-provider transfer reference",
    );
    expect(db.payout.updateMany).not.toHaveBeenCalled();
  });
});

describe("getPendingBalance", () => {
  it("sums totals of all eligible bookings", async () => {
    vi.mocked(db.booking.aggregate).mockResolvedValue({ _sum: { total: 45000 } } as any);

    const balance = await getPendingBalance(OWNER_ID);

    expect(balance).toBe(45000);
    expect(db.booking.aggregate).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        hostel: { ownerId: OWNER_ID },
        status: { in: ["CONFIRMED", "COMPLETED"] },
        paymentStatus: "PAID",
        checkOut: expect.objectContaining({ lte: expect.any(Date) }),
        payoutId: null,
      }),
      _sum: { total: true },
    }));
  });

  it("returns 0 when there are no eligible bookings", async () => {
    vi.mocked(db.booking.aggregate).mockResolvedValue({ _sum: { total: null } } as any);

    const balance = await getPendingBalance(OWNER_ID);

    expect(balance).toBe(0);
  });
});
