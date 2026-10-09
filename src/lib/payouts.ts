// Path: src/lib/payouts.ts

import { db } from "@/lib/db";
import { encryptPayoutDestinationSnapshot } from "@/lib/payout-destination";
import type { Prisma } from "@/generated/client";

export class PayoutServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: 404 | 409 | 503,
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

    let destinationSnapshot: string;
    try {
      destinationSnapshot = encryptPayoutDestinationSnapshot({
        bankAccountTitle: owner.bankAccountTitle.trim(),
        bankAccountNumber: owner.bankAccountNumber.trim(),
        bankName: owner.bankName.trim(),
      });
    } catch {
      throw new PayoutServiceError(
        "Payout destination encryption is unavailable. Configure PAYOUT_DESTINATION_ENCRYPTION_KEY before creating a batch.",
        503,
      );
    }

    const payout = await tx.payout.create({
      data: {
        ownerId,
        amount: 0,
        createdBy: adminUserId,
        status: "PENDING",
        destinationSnapshot,
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

    const finalizedPayout = await tx.payout.update({
      where: { id: payout.id },
      data: { amount },
    });

    await tx.payoutAuditEvent.create({
      data: {
        payoutId: payout.id,
        actorId: adminUserId,
        action: "BATCH_CREATED",
        amount,
      },
    });

    return finalizedPayout;
  });
}

/**
 * Marks a payout paid. Uses a conditional updateMany (status: PENDING in the
 * where clause) rather than findUnique-then-update, so two concurrent
 * "mark paid" clicks on the same payout can't both succeed — matching the
 * idempotent-update pattern already used by the Safepay webhook handler.
 */
export async function markPayoutPaid(payoutId: string, adminUserId: string, reference: string) {
  const transferReference = reference.trim();
  if (!transferReference || transferReference.length > 200) {
    throw new PayoutServiceError("Enter the bank or payment-provider transfer reference before marking this payout paid.", 409);
  }

  return db.$transaction(async (tx) => {
    const pendingBatch = await tx.payout.findUnique({
      where: { id: payoutId },
      select: { id: true, ownerId: true, amount: true, status: true },
    });
    if (!pendingBatch) {
      throw new PayoutServiceError("Payout not found.", 404);
    }
    if (pendingBatch.status !== "PENDING") {
      throw new PayoutServiceError(`Cannot mark a ${pendingBatch.status} payout as paid.`, 409);
    }

    const linkedBookings = await tx.booking.aggregate({
      where: { payoutId },
      _count: { _all: true },
      _sum: { total: true },
    });
    const stillEligibleCount = await tx.booking.count({
      where: {
        payoutId,
        status: { in: ["CONFIRMED", "COMPLETED"] },
        paymentStatus: "PAID",
        checkOut: { lte: new Date() },
        hostel: { ownerId: pendingBatch.ownerId },
      },
    });
    const linkedAmount = Number(linkedBookings._sum.total ?? 0);
    if (
      linkedBookings._count._all === 0 ||
      stillEligibleCount !== linkedBookings._count._all ||
      linkedAmount <= 0 ||
      pendingBatch.amount !== linkedAmount
    ) {
      throw new PayoutServiceError(
        "This payout no longer matches its eligible booking claims. Do not transfer it; void the batch only if no transfer was sent, then investigate the difference.",
        409,
      );
    }

    const result = await tx.payout.updateMany({
      where: { id: payoutId, status: "PENDING" },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paidBy: adminUserId,
        reference: transferReference,
      },
    });

    if (result.count === 0) {
      const existing = await tx.payout.findUnique({ where: { id: payoutId } });
      if (!existing) {
        throw new PayoutServiceError("Payout not found.", 404);
      }
      throw new PayoutServiceError(`Cannot mark a ${existing.status} payout as paid.`, 409);
    }

    const payout = await tx.payout.findUniqueOrThrow({ where: { id: payoutId } });
    await tx.payoutAuditEvent.create({
      data: {
        payoutId,
        actorId: adminUserId,
        action: "MARKED_PAID",
        amount: payout.amount,
        reference: transferReference,
      },
    });
    return payout;
  });
}

/**
 * Voids a pending batch only after an admin confirms no transfer was sent.
 * The audit fields and booking release commit together, so a failed release
 * cannot leave a cancelled payout with bookings still locked (or vice versa).
 */
export async function cancelPayoutBatch(
  payoutId: string,
  adminUserId: string,
  reason: string,
  transferNotSentConfirmed: boolean,
) {
  const cancellationReason = reason.trim();
  if (!transferNotSentConfirmed) {
    throw new PayoutServiceError("Confirm that no transfer was sent before voiding this payout.", 409);
  }
  if (cancellationReason.length < 10 || cancellationReason.length > 500) {
    throw new PayoutServiceError("Enter a cancellation reason between 10 and 500 characters.", 409);
  }

  return db.$transaction(async (tx) => {
    const result = await tx.payout.updateMany({
      where: { id: payoutId, status: "PENDING" },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledBy: adminUserId,
        cancellationReason,
      },
    });

    if (result.count === 0) {
      const existing = await tx.payout.findUnique({ where: { id: payoutId } });
      if (!existing) {
        throw new PayoutServiceError("Payout not found.", 404);
      }
      throw new PayoutServiceError(`Cannot void a ${existing.status} payout.`, 409);
    }

    await tx.booking.updateMany({
      where: { payoutId },
      data: { payoutId: null },
    });

    const payout = await tx.payout.findUniqueOrThrow({ where: { id: payoutId } });
    await tx.payoutAuditEvent.create({
      data: {
        payoutId,
        actorId: adminUserId,
        action: "VOIDED",
        amount: payout.amount,
        reason: cancellationReason,
      },
    });
    return payout;
  });
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
