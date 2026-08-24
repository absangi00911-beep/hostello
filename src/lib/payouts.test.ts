// Path: src/lib/payouts.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
    booking: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    payout: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import {
  getEligibleBookings,
  createPayoutBatch,
  markPayoutPaid,
  getPendingBalance,
} from "./payouts";
import { db } from "../lib/db";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const OWNER_ID = "usr_owner_0000000000000001";
const ADMIN_ID = "usr_admin_0000000000000001";
const PAYOUT_ID = "pay_0000000000000000000001";

function makeBooking(overrides = {}) {
  return {
    id: "bkg_0000000000000000000001",
    hostelId: "hst_0000000000000000000001",
    total: 30000,
    status: "COMPLETED",
    paymentStatus: "PAID",
    payoutId: null,
    checkOut: new Date("2026-06-01T00:00:00.000Z"),
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
    ...overrides,
  };
}

/** Build a transaction mock that executes the callback with the given tx object. */
function mockTransaction(tx: any) {
  vi.mocked(db.$transaction).mockImplementation(async (cb: any) => cb(tx));
  return tx;
}

beforeEach(() => {
  vi.clearAllMocks();
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
    vi.mocked(db.booking.findMany).mockResolvedValue([]);

    await expect(createPayoutBatch(OWNER_ID, ADMIN_ID)).rejects.toThrow(
      "No eligible bookings to pay out",
    );
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("creates a payout, claims the eligible bookings, and sums their totals", async () => {
    const bookings = [makeBooking({ id: "b1", total: 30000 }), makeBooking({ id: "b2", total: 45000 })];
    vi.mocked(db.booking.findMany).mockResolvedValue(bookings as any);

    const tx = mockTransaction({
      payout: {
        create: vi.fn().mockResolvedValue(makePayout()),
        update: vi.fn().mockImplementation(({ data }: any) => makePayout(data)),
      },
      booking: {
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
        findMany: vi.fn().mockResolvedValue(bookings),
      },
    });

    const result = await createPayoutBatch(OWNER_ID, ADMIN_ID);

    expect(tx.payout.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ ownerId: OWNER_ID, createdBy: ADMIN_ID, status: "PENDING" }) }),
    );
    expect(tx.booking.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["b1", "b2"] }, payoutId: null },
      data: { payoutId: PAYOUT_ID },
    });
    expect(tx.payout.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { amount: 75000 } }),
    );
    expect(result.amount).toBe(75000);
  });

  it("throws when every eligible booking was already claimed by a concurrent batch", async () => {
    const bookings = [makeBooking({ id: "b1" })];
    vi.mocked(db.booking.findMany).mockResolvedValue(bookings as any);

    mockTransaction({
      payout: { create: vi.fn().mockResolvedValue(makePayout()) },
      booking: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }), // lost the race
        findMany: vi.fn(),
      },
    });

    await expect(createPayoutBatch(OWNER_ID, ADMIN_ID)).rejects.toThrow(
      "already claimed by another payout batch",
    );
  });

  it("sums only the bookings actually claimed, not the initial eligibility read (partial-race case)", async () => {
    // Three were eligible when read, but only two were still unclaimed by the time
    // the conditional update ran — the third lost the race to another batch.
    const bookings = [
      makeBooking({ id: "b1", total: 10000 }),
      makeBooking({ id: "b2", total: 20000 }),
      makeBooking({ id: "b3", total: 99999 }),
    ];
    vi.mocked(db.booking.findMany).mockResolvedValue(bookings as any);

    const tx = mockTransaction({
      payout: {
        create: vi.fn().mockResolvedValue(makePayout()),
        update: vi.fn().mockImplementation(({ data }: any) => makePayout(data)),
      },
      booking: {
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
        // Only b1 and b2 actually ended up attached to this payout.
        findMany: vi.fn().mockResolvedValue([bookings[0], bookings[1]]),
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
// ═════════════════════════════════════════════════════════════════════════════

describe("markPayoutPaid", () => {
  it("marks a PENDING payout paid with reference, paidAt, paidBy", async () => {
    vi.mocked(db.payout.updateMany).mockResolvedValue({ count: 1 } as any);
    vi.mocked(db.payout.findUniqueOrThrow).mockResolvedValue(
      makePayout({ status: "PAID", paidBy: ADMIN_ID, reference: "BANK-REF-1" }) as any,
    );

    const result = await markPayoutPaid(PAYOUT_ID, ADMIN_ID, "BANK-REF-1");

    expect(db.payout.updateMany).toHaveBeenCalledWith({
      where: { id: PAYOUT_ID, status: "PENDING" },
      data: expect.objectContaining({
        status: "PAID",
        paidBy: ADMIN_ID,
        reference: "BANK-REF-1",
        paidAt: expect.any(Date),
      }),
    });
    expect(result.status).toBe("PAID");
  });

  it("throws 'Payout not found' when the id doesn't exist", async () => {
    vi.mocked(db.payout.updateMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(db.payout.findUnique).mockResolvedValue(null);

    await expect(markPayoutPaid("nonexistent", ADMIN_ID)).rejects.toThrow(
      "Payout not found",
    );
  });

  it("throws when the payout is already PAID", async () => {
    vi.mocked(db.payout.updateMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(db.payout.findUnique).mockResolvedValue(makePayout({ status: "PAID" }) as any);

    await expect(markPayoutPaid(PAYOUT_ID, ADMIN_ID)).rejects.toThrow(
      "Cannot mark a PAID payout as paid",
    );
  });

  it("throws when the payout is CANCELLED", async () => {
    vi.mocked(db.payout.updateMany).mockResolvedValue({ count: 0 } as any);
    vi.mocked(db.payout.findUnique).mockResolvedValue(makePayout({ status: "CANCELLED" }) as any);

    await expect(markPayoutPaid(PAYOUT_ID, ADMIN_ID)).rejects.toThrow(
      "Cannot mark a CANCELLED payout as paid",
    );
  });

  it("is idempotent — a second concurrent call for the same payout can't also succeed", async () => {
    // First call's updateMany already flipped status to PAID; second call's
    // conditional where (status: PENDING) now matches nothing.
    vi.mocked(db.payout.updateMany).mockResolvedValueOnce({ count: 1 } as any);
    vi.mocked(db.payout.findUniqueOrThrow).mockResolvedValueOnce(makePayout({ status: "PAID" }) as any);
    await markPayoutPaid(PAYOUT_ID, ADMIN_ID);

    vi.mocked(db.payout.updateMany).mockResolvedValueOnce({ count: 0 } as any);
    vi.mocked(db.payout.findUnique).mockResolvedValueOnce(makePayout({ status: "PAID" }) as any);

    await expect(markPayoutPaid(PAYOUT_ID, ADMIN_ID)).rejects.toThrow(
      "Cannot mark a PAID payout as paid",
    );
  });

  it("defaults reference to null when not provided", async () => {
    vi.mocked(db.payout.updateMany).mockResolvedValue({ count: 1 } as any);
    vi.mocked(db.payout.findUniqueOrThrow).mockResolvedValue(makePayout({ status: "PAID" }) as any);

    await markPayoutPaid(PAYOUT_ID, ADMIN_ID);

    expect(db.payout.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ reference: null }) }),
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// getPendingBalance
// ═════════════════════════════════════════════════════════════════════════════

describe("getPendingBalance", () => {
  it("sums totals of all eligible bookings", async () => {
    vi.mocked(db.booking.findMany).mockResolvedValue([
      makeBooking({ total: 30000 }),
      makeBooking({ total: 15000 }),
    ] as any);

    const balance = await getPendingBalance(OWNER_ID);

    expect(balance).toBe(45000);
  });

  it("returns 0 when there are no eligible bookings", async () => {
    vi.mocked(db.booking.findMany).mockResolvedValue([]);

    const balance = await getPendingBalance(OWNER_ID);

    expect(balance).toBe(0);
  });
});
