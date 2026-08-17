// Path: src/lib/payouts.ts

import { db } from "@/lib/db";

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
      hostel: { ownerId },
      status: { in: ["CONFIRMED", "COMPLETED"] },
      paymentStatus: "PAID",
      checkOut: { lte: new Date() },
      payoutId: null,
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
  const eligibleIds = (await getEligibleBookings(ownerId)).map((b) => b.id);

  if (eligibleIds.length === 0) {
    throw new Error("No eligible bookings to pay out for this owner.");
  }

  return db.$transaction(async (tx) => {
    const payout = await tx.payout.create({
      data: {
        ownerId,
        amount: 0,
        createdBy: adminUserId,
        status: "PENDING",
      },
    });

    const claimed = await tx.booking.updateMany({
      where: { id: { in: eligibleIds }, payoutId: null },
      data: { payoutId: payout.id },
    });

    if (claimed.count === 0) {
      throw new Error("All eligible bookings were already claimed by another payout batch.");
    }

    const claimedBookings = await tx.booking.findMany({
      where: { payoutId: payout.id },
      select: { total: true },
    });
    const amount = claimedBookings.reduce((sum, b) => sum + b.total, 0);

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
      throw new Error("Payout not found.");
    }
    throw new Error(`Cannot mark a ${existing.status} payout as paid.`);
  }

  return db.payout.findUniqueOrThrow({ where: { id: payoutId } });
}

/** Pending balance for an owner: sum of eligible bookings not yet in a payout batch. */
export async function getPendingBalance(ownerId: string) {
  const eligible = await getEligibleBookings(ownerId);
  return eligible.reduce((sum, b) => sum + b.total, 0);
}
