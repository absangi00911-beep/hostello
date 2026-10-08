// Path: src/lib/payouts.ts

import { db } from "@/lib/db";
import type { Prisma } from "@/generated/client";

export class PayoutServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: 404 | 409,
  ) {
    super(message);
    this.name = "PayoutServiceError";
  }
}

/** Shared booking eligibility policy for balances, admin queues, and claims. */
export function getEligiblePayoutBookingWhere(): Prisma.BookingWhereInput {
  return {
    status: { in: ["CONFIRMED", "COMPLETED"] },
    paymentStatus: "PAID",
    checkOut: { lte: new Date() },
    payoutId: null,
  };
}

/**
 * Service to handle owner payout operations.
 *
 * v1 design: manual ledger only. An admin generates a batch of everything
 * currently eligible for an owner, transfers the money outside the system
 * (bank transfer / JazzCash), then marks the batch paid with a reference
 * note. No bank API integration in this phase.
 *
 * Eligibility: a booking is payout-eligible once its `checkOut` date has
 * passed, it's CONFIRMED or COMPLETED, its `paymentStatus` is PAID, and it
 * isn't already attached to another payout. Paying out before `checkOut`
 * would mean clawing back money from an owner on a late cancellation —
 * waiting avoids that entirely. See docs/superpowers/specs/2026-07-01-payout-refund-system.md.
 */

export async function getEligibleBookings(ownerId: string) {
  return db.booking.findMany({
    where: {
      ...getEligiblePayoutBookingWhere(),
      hostel: { ownerId },
    },
    orderBy: { checkOut: "asc" },
  });
}

/**
 * Generates a payout batch for an owner: claims every currently-eligible
 * booking and sums their totals. The claim itself is a conditional update
 * (payoutId: null in the where clause), so a concurrent batch generation
 * for the same owner can't double-claim the same booking — whichever
 * request's update lands first wins that booking, and the amount is always
 * derived from what actually got claimed, not the initial eligibility read.
 */
export async function createPayoutBatch(ownerId: string, adminUserId: string) {
  return db.$transaction(async (tx) => {
    const owner = await tx.user.findUnique({
      where: { id: ownerId },
      select: {
        role: true,
        bankAccountTitle: true,
        bankAccountNumber: true,
        bankName: true,
      },
    });

    if (!owner || owner.role !== "OWNER") {
      throw new PayoutServiceError("Payout owner not found.", 404);
    }
    if (
      !owner.bankAccountTitle?.trim() ||
      !owner.bankAccountNumber?.trim() ||
      !owner.bankName?.trim()
    ) {
      throw new PayoutServiceError("Owner must complete all payout bank details before a batch can be generated.", 409);
    }

    const payout = await tx.payout.create({
      data: {
        ownerId,
        amount: 0,
        createdBy: adminUserId,
        status: "PENDING",
      },
    });

    const claimed = await tx.booking.updateMany({
      where: {
        ...getEligiblePayoutBookingWhere(),
        hostel: { ownerId },
      },
      data: { payoutId: payout.id },
    });

    if (claimed.count === 0) {
      throw new PayoutServiceError("No eligible bookings to pay out for this owner; another batch may have claimed them.", 409);
    }

    const claimedBookings = await tx.booking.aggregate({
      where: { payoutId: payout.id },
      _sum: { total: true },
    });
    const amount = Number(claimedBookings._sum.total ?? 0);

    return tx.payout.update({
      where: { id: payout.id },
      data: { amount },
    });
  });
}

/**
 * Marks a payout paid. Uses a conditional updateMany (status: PENDING in the
 * where clause) rather than findUnique-then-update, so two concurrent
 * "mark paid" clicks on the same payout can't both succeed — matching the
 * idempotent-update pattern already used by the Safepay webhook handler.
 */
export async function markPayoutPaid(payoutId: string, adminUserId: string, reference?: string) {
  const result = await db.payout.updateMany({
    where: { id: payoutId, status: "PENDING" },
    data: {
      status: "PAID",
      paidAt: new Date(),
      paidBy: adminUserId,
      reference: reference ?? null,
    },
  });

  if (result.count === 0) {
    const existing = await db.payout.findUnique({ where: { id: payoutId } });
    if (!existing) {
      throw new PayoutServiceError("Payout not found.", 404);
    }
    throw new PayoutServiceError(`Cannot mark a ${existing.status} payout as paid.`, 409);
  }

  return db.payout.findUniqueOrThrow({ where: { id: payoutId } });
}

/** Pending balance for an owner: sum of eligible bookings not yet in a payout batch. */
export async function getPendingBalance(ownerId: string) {
  const eligible = await db.booking.aggregate({
    where: {
      ...getEligiblePayoutBookingWhere(),
      hostel: { ownerId },
    },
    _sum: { total: true },
  });
  return Number(eligible._sum.total ?? 0);
}
