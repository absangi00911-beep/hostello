// Path: src/lib/refunds.ts

import { db } from "@/lib/db";
import { refundPayment } from "@/lib/safepay";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { bookingRefundedEmail } from "@/lib/email-templates/booking-status";

/**
 * Processes a refund for a booking. Admin-triggered only (see
 * docs/superpowers/specs/2026-07-01-payout-refund-system.md) — there's no
 * self-service path for students or owners in this phase.
 *
 * A booking is only refundable if it's currently `paymentStatus: PAID` and
 * `status: CANCELLED`. Anything else is rejected rather than silently
 * no-op'd, since a refund on the wrong state is exactly the kind of mistake
 * this function exists to prevent.
 *
 * The Safepay call is best-effort: `refundPayment()` targets an endpoint
 * that couldn't be verified from outside a Safepay merchant dashboard (see
 * the warning on that function). Whether or not the automatic call
 * succeeds, this function always updates our own records — the `automatic`
 * flag on the result tells the caller which happened, so the admin UI can
 * either confirm "refunded automatically" or prompt "complete this in the
 * Safepay dashboard, then confirm" without ever leaving the booking stuck
 * in an ambiguous state on our side.
 */
export async function processRefund(bookingId: string, adminUserId: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: { select: { name: true, email: true } },
      hostel: { select: { name: true } },
    },
  });

  if (!booking) {
    throw new Error("Booking not found.");
  }

  if (booking.paymentStatus !== "PAID" || booking.status !== "CANCELLED") {
    throw new Error(
      `Cannot refund a booking with paymentStatus ${booking.paymentStatus} and status ${booking.status}. A refund requires PAID + CANCELLED.`,
    );
  }

  let automatic = true;
  if (booking.transactionId) {
    try {
      await refundPayment({ transactionId: booking.transactionId, amount: booking.total });
    } catch (err) {
      console.error(`[processRefund] Safepay call failed for booking ${bookingId}, falling back to manual`, err);
      automatic = false;
    }
  } else {
    // No transactionId on file (shouldn't normally happen for a PAID booking,
    // but don't let a missing identifier block closing this out manually).
    automatic = false;
  }

  const result = await db.booking.updateMany({
    where: { id: bookingId, paymentStatus: "PAID" },
    data: {
      paymentStatus: "REFUNDED",
      refundedAt: new Date(),
      refundedBy: adminUserId,
    },
  });

  if (result.count === 0) {
    throw new Error("This booking was already refunded by a concurrent request.");
  }

  const updated = await db.booking.findUniqueOrThrow({ where: { id: bookingId } });

  // Fire-and-forget — a notification failure must never undo a refund that's
  // already landed on our side, matching the pattern used everywhere else
  // in this codebase (see the booking-confirmed email in the payment webhook).
  createNotification({
    userId: booking.userId,
    type: "BOOKING_REFUNDED",
    title: "Refund processed",
    message: `Your refund of PKR ${Math.round(booking.total).toLocaleString("en-PK")} for ${booking.hostel.name} has been processed.`,
    bookingId: booking.id,
  }).catch((err) => console.error("[processRefund] In-app notification failed:", err));

  sendEmail(
    bookingRefundedEmail({
      studentName: booking.user.name ?? "there",
      studentEmail: booking.user.email,
      hostelName: booking.hostel.name,
      bookingId: booking.id,
      amount: booking.total,
    }),
  ).catch((err) => console.error("[processRefund] Refund email failed:", err));

  return { automatic, booking: updated };
}
