// Path: src/lib/refunds.ts

import { createHash, randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { refundPayment } from "@/lib/safepay";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { bookingRefundedEmail } from "@/lib/email-templates/booking-status";
import { getSafeErrorSummary } from "@/lib/safe-error";

export class RefundServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode: 404 | 409,
  ) {
    super(message);
    this.name = "RefundServiceError";
  }
}

/**
 * Processes a refund for a booking. Admin-triggered only (see
 * docs/superpowers/specs/2026-07-01-payout-refund-system.md).
 *
 * A provider timeout is ambiguous. The booking remains PAID and moves to
 * UNCERTAIN; a second automatic request is blocked until an admin reconciles
 * the provider state. Every request and resolution is stored as an
 * append-only audit event.
 */
async function loadRefundableBooking(bookingId: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: { select: { name: true, email: true } },
      hostel: { select: { name: true } },
    },
  });

  if (!booking) {
    throw new RefundServiceError("Booking not found.", 404);
  }

  if (booking.paymentStatus !== "PAID" || booking.status !== "CANCELLED") {
    throw new RefundServiceError(
      `Cannot refund a booking with paymentStatus ${booking.paymentStatus} and status ${booking.status}. A refund requires PAID + CANCELLED.`,
      409,
    );
  }

  return booking;
}

function providerResponseDigest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value) ?? "null").digest("hex");
}

async function createAutomaticRequest(booking: Awaited<ReturnType<typeof loadRefundableBooking>>, adminUserId: string) {
  const attemptId = randomUUID();
  const claim = await db.$transaction(async (tx) => {
    const updated = await tx.booking.updateMany({
      where: {
        id: booking.id,
        paymentStatus: "PAID",
        status: "CANCELLED",
        refundState: "NONE",
      },
      data: { refundState: "PROCESSING" },
    });
    if (updated.count === 0) return false;

    await tx.refundAuditEvent.create({
      data: {
        attemptId,
        bookingId: booking.id,
        adminUserId,
        type: "AUTOMATIC_REQUESTED",
        transactionId: booking.transactionId,
        amount: booking.total,
        currency: "PKR",
      },
    });
    return true;
  });

  if (!claim) {
    throw new RefundServiceError(
      "A refund action is already in progress or this booking changed. Reconcile the existing action before continuing.",
      409,
    );
  }
  return attemptId;
}

async function markAutomaticUncertain(
  booking: Awaited<ReturnType<typeof loadRefundableBooking>>,
  adminUserId: string,
  attemptId: string,
  err: unknown,
) {
  const summary = getSafeErrorSummary(err);
  await db.$transaction(async (tx) => {
    await tx.booking.updateMany({
      where: { id: booking.id, paymentStatus: "PAID", status: "CANCELLED", refundState: "PROCESSING" },
      data: { refundState: "UNCERTAIN" },
    });
    await tx.refundAuditEvent.create({
      data: {
        attemptId,
        bookingId: booking.id,
        adminUserId,
        type: "AUTOMATIC_UNCERTAIN",
        transactionId: booking.transactionId,
        amount: booking.total,
        currency: "PKR",
        failureName: summary.name.slice(0, 64),
        failureCode: summary.code?.slice(0, 64),
        failureStatus: summary.status,
      },
    });
  });
}

async function recordAutomaticConfirmation(
  booking: Awaited<ReturnType<typeof loadRefundableBooking>>,
  adminUserId: string,
  attemptId: string,
  providerState: string,
  providerResponseDigest: string,
) {
  const updated = await db.$transaction(async (tx) => {
    // Store provider evidence even if a concurrent admin action changed the
    // booking after Safepay confirmed the refund.
    await tx.refundAuditEvent.create({
      data: {
        attemptId,
        bookingId: booking.id,
        adminUserId,
        type: "AUTOMATIC_CONFIRMED",
        transactionId: booking.transactionId,
        amount: booking.total,
        currency: "PKR",
        providerState,
        providerResponseDigest,
      },
    });
    const result = await tx.booking.updateMany({
      where: {
        id: booking.id,
        paymentStatus: "PAID",
        status: "CANCELLED",
        refundState: "PROCESSING",
      },
      data: {
        paymentStatus: "REFUNDED",
        refundState: "REFUNDED",
        refundedAt: new Date(),
        refundedBy: adminUserId,
      },
    });
    if (result.count === 0) return null;
    return tx.booking.findUniqueOrThrow({ where: { id: booking.id } });
  });

  if (!updated) {
    throw new RefundServiceError(
      "Safepay confirmed the refund, but the booking changed during reconciliation. Review the recorded provider evidence.",
      409,
    );
  }
  return updated;
}

async function notifyRefunded(booking: Awaited<ReturnType<typeof loadRefundableBooking>>) {
  createNotification({
    userId: booking.userId,
    type: "BOOKING_REFUNDED",
    title: "Refund processed",
    message: `Your refund of PKR ${Math.round(booking.total).toLocaleString("en-PK")} for ${booking.hostel.name} has been processed.`,
    bookingId: booking.id,
  }).catch((err) =>
    console.error("[processRefund] In-app notification failed:", getSafeErrorSummary(err)),
  );

  sendEmail(
    bookingRefundedEmail({
      studentName: booking.user.name ?? "there",
      studentEmail: booking.user.email,
      hostelName: booking.hostel.name,
      bookingId: booking.id,
      amount: booking.total,
    }),
  ).catch((err) =>
    console.error("[processRefund] Refund email failed:", getSafeErrorSummary(err)),
  );
}

export async function processRefund(bookingId: string, adminUserId: string) {
  const booking = await loadRefundableBooking(bookingId);
  if (booking.refundState === "PROCESSING" || booking.refundState === "UNCERTAIN") {
    throw new RefundServiceError(
      "A previous refund request has no confirmed outcome. Check Safepay and use the manual confirmation action only after verifying the refund.",
      409,
    );
  }

  const attemptId = await createAutomaticRequest(booking, adminUserId);
  if (!booking.transactionId) {
    await markAutomaticUncertain(
      booking,
      adminUserId,
      attemptId,
      Object.assign(new Error("Missing Safepay transaction reference."), { code: "missing_transaction_id" }),
    );
    return {
      automatic: false,
      manualConfirmed: false,
      booking: { ...booking, refundState: "UNCERTAIN" as const },
    };
  }

  let providerResult;
  try {
    providerResult = await refundPayment({ transactionId: booking.transactionId, amount: booking.total });
  } catch (err) {
    console.error(
      "[processRefund] Safepay refund was not confirmed; manual reconciliation required",
      getSafeErrorSummary(err),
    );
    await markAutomaticUncertain(booking, adminUserId, attemptId, err);
    return {
      automatic: false,
      manualConfirmed: false,
      booking: { ...booking, refundState: "UNCERTAIN" as const },
    };
  }

  const updated = await recordAutomaticConfirmation(
    booking,
    adminUserId,
    attemptId,
    providerResult.state,
    providerResponseDigest(providerResult.raw),
  );
  await notifyRefunded(booking);
  return { automatic: true, manualConfirmed: false, booking: updated };
}

/** Record a refund an admin has already completed and verified in Safepay. */
export async function confirmManualRefund(bookingId: string, adminUserId: string) {
  const booking = await loadRefundableBooking(bookingId);
  const updated = await db.$transaction(async (tx) => {
    const latestAttempt = await tx.refundAuditEvent.findFirst({
      where: { bookingId: booking.id, type: "AUTOMATIC_REQUESTED" },
      orderBy: { createdAt: "desc" },
      select: { attemptId: true, createdAt: true },
    });
    const processingTimedOut = booking.refundState === "PROCESSING" &&
      latestAttempt !== null &&
      latestAttempt.createdAt <= new Date(Date.now() - 5 * 60 * 1000);

    if (booking.refundState === "PROCESSING" && !processingTimedOut) {
      throw new RefundServiceError(
        "The automatic refund may still be processing. Wait for its outcome, then verify Safepay before confirming manually.",
        409,
      );
    }

    const allowedRefundStates = booking.refundState === "PROCESSING"
      ? ["PROCESSING"] as const
      : ["NONE", "UNCERTAIN"] as const;
    const attemptId = latestAttempt?.attemptId ?? randomUUID();
    const result = await tx.booking.updateMany({
      where: {
        id: booking.id,
        paymentStatus: "PAID",
        status: "CANCELLED",
        refundState: { in: [...allowedRefundStates] },
      },
      data: {
        paymentStatus: "REFUNDED",
        refundState: "REFUNDED",
        refundedAt: new Date(),
        refundedBy: adminUserId,
      },
    });
    if (result.count === 0) {
      throw new RefundServiceError("This booking changed or was already refunded by a concurrent request.", 409);
    }

    await tx.refundAuditEvent.create({
      data: {
        attemptId,
        bookingId: booking.id,
        adminUserId,
        type: "MANUAL_CONFIRMED",
        transactionId: booking.transactionId,
        amount: booking.total,
        currency: "PKR",
      },
    });
    return tx.booking.findUniqueOrThrow({ where: { id: booking.id } });
  });

  await notifyRefunded(booking);
  return { automatic: false, manualConfirmed: true, booking: updated };
}
