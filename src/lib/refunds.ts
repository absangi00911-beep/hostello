// Path: src/lib/refunds.ts

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
 * docs/superpowers/specs/2026-07-01-payout-refund-system.md) — there's no
 * self-service path for students or owners in this phase.
 *
 * A booking is only refundable if it's currently `paymentStatus: PAID` and
 * `status: CANCELLED`. A provider timeout is ambiguous, so it leaves the
 * booking paid and requires an explicit admin confirmation after checking
 * Safepay. Never report a refund until the provider or an admin confirms it.
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

async function recordRefund(booking: Awaited<ReturnType<typeof loadRefundableBooking>>, adminUserId: string) {
  const result = await db.booking.updateMany({
    where: { id: booking.id, paymentStatus: "PAID", status: "CANCELLED" },
    data: {
      paymentStatus: "REFUNDED",
      refundedAt: new Date(),
      refundedBy: adminUserId,
    },
  });

  if (result.count === 0) {
    throw new RefundServiceError("This booking changed or was already refunded by a concurrent request.", 409);
  }

  const updated = await db.booking.findUniqueOrThrow({ where: { id: booking.id } });
  createNotification({
    userId: booking.userId,
    type: "BOOKING_REFUNDED",
    title: "Refund processed",
    message: `Your refund of PKR ${Math.round(booking.total).toLocaleString("en-PK")} for ${booking.hostel.name} has been processed.`,
    bookingId: booking.id,
  }).catch((err) =>
    console.error(
      "[processRefund] In-app notification failed:",
      getSafeErrorSummary(err),
    ),
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

  return updated;
}

export async function processRefund(bookingId: string, adminUserId: string) {
  const booking = await loadRefundableBooking(bookingId);

  let automatic = true;
  if (booking.transactionId) {
    try {
      await refundPayment({ transactionId: booking.transactionId, amount: booking.total });
    } catch (err) {
      console.error(
        "[processRefund] Safepay refund was not confirmed; manual reconciliation required",
        getSafeErrorSummary(err),
      );
      automatic = false;
    }
  } else {
    // No transactionId on file (shouldn't normally happen for a PAID booking,
    // but don't let a missing identifier block closing this out manually).
    automatic = false;
  }

  if (!automatic) return { automatic: false, manualConfirmed: false, booking };
  return { automatic: true, manualConfirmed: false, booking: await recordRefund(booking, adminUserId) };
}

/** Record a refund an admin has already completed and verified in Safepay. */
export async function confirmManualRefund(bookingId: string, adminUserId: string) {
  const booking = await loadRefundableBooking(bookingId);
  const updated = await recordRefund(booking, adminUserId);
  return { automatic: false, manualConfirmed: true, booking: updated };
}
