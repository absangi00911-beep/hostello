import { db } from "@/lib/db";
import {
  createSeatHolds,
  getRoomStayAvailability,
  lockHostelInventory,
} from "@/lib/room-availability-service";
import { processRefund } from "@/lib/refunds";
import { toSafepayMinorUnits } from "@/lib/safepay";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { logOperationalEvent } from "@/lib/operational-logger";

type LatePaymentInput = {
  bookingId: string;
  sourceWebhookEventId: string;
  providerTracker: string;
  amountMinorUnits: number;
  currency: string;
};

type ResolutionOutcome =
  | "REINSTATED"
  | "REFUND_REQUIRED"
  | "DUPLICATE"
  | "RECONCILIATION_REQUIRED";

function isSeatHoldConflict(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error && typeof error.code === "string"
    ? error.code
    : "cause" in error && error.cause && typeof error.cause === "object" &&
        "code" in error.cause && typeof error.cause.code === "string"
      ? error.cause.code
      : null;
  return ["23P01", "P2002", "P2004", "P2034"].includes(code ?? "");
}

async function resolveInTransaction(input: LatePaymentInput, forceRefund = false, client: typeof db = db) {
  return client.$transaction(async (tx) => {
    const reference = await tx.booking.findUnique({
      where: { id: input.bookingId },
      select: { id: true, hostelId: true },
    });
    if (!reference) return { outcome: "RECONCILIATION_REQUIRED" as const, newResolution: false };

    const hostelLocked = await lockHostelInventory(tx, reference.hostelId);
    const booking = await tx.booking.findUnique({
      where: { id: input.bookingId },
      include: {
        hostel: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            status: true,
            cancellationPolicy: true,
            owner: { select: { id: true } },
          },
        },
        room: { select: { id: true, hostelId: true, capacity: true } },
        user: { select: { name: true } },
      },
    });
    if (!booking) return { outcome: "RECONCILIATION_REQUIRED" as const, newResolution: false };

    const existing = await tx.latePaymentResolution.findFirst({
      where: {
        OR: [
          { sourceWebhookEventId: input.sourceWebhookEventId },
          { providerTracker: input.providerTracker },
        ],
      },
      select: {
        bookingId: true,
        sourceWebhookEventId: true,
        providerTracker: true,
      },
    });
    if (existing) {
      return {
        outcome: existing.bookingId === booking.id &&
          existing.providerTracker === input.providerTracker
          ? "DUPLICATE" as const
          : "RECONCILIATION_REQUIRED" as const,
        newResolution: false,
      };
    }

    if (
      booking.status !== "CANCELLED" ||
      !["PENDING", "FAILED"].includes(booking.paymentStatus) ||
      booking.refundState !== "NONE" ||
      booking.refundedAmount !== 0 ||
      booking.payoutId !== null ||
      (booking.transactionId !== null && booking.transactionId !== input.providerTracker) ||
      (booking.paymentMethod !== null && booking.paymentMethod !== "safepay") ||
      input.currency !== "PKR" ||
      !Number.isSafeInteger(input.amountMinorUnits) ||
      input.amountMinorUnits !== toSafepayMinorUnits(booking.total)
    ) {
      return { outcome: "RECONCILIATION_REQUIRED" as const, newResolution: false };
    }

    const reason = booking.paymentStatus === "FAILED"
      ? "ABANDONED_CHECKOUT" as const
      : "CANCELLED_WHILE_UNPAID" as const;
    const availability = !forceRefund &&
        hostelLocked &&
        booking.hostel.status === "ACTIVE" &&
        booking.hostel.cancellationPolicy !== null &&
        booking.room !== null &&
        booking.room.hostelId === booking.hostelId
      ? await getRoomStayAvailability(tx, {
          hostelId: booking.hostelId,
          roomId: booking.room.id,
          capacity: booking.room.capacity,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          guests: booking.guests,
        })
      : null;
    const reinstate = Boolean(availability?.fits);
    const updated = await tx.booking.updateMany({
      where: {
        id: booking.id,
        status: "CANCELLED",
        paymentStatus: { in: ["PENDING", "FAILED"] },
        paymentMethod: booking.paymentMethod,
        transactionId: booking.transactionId,
        refundState: "NONE",
        refundedAmount: 0,
        payoutId: null,
      },
      data: reinstate
        ? {
            status: "PENDING",
            paymentStatus: "PAID",
            transactionId: input.providerTracker,
            cancellationRefundAmount: null,
            ownerResponseDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            ownerResponseReminderSentAt: null,
          }
        : {
            paymentStatus: "PAID",
            transactionId: input.providerTracker,
            cancellationRefundAmount: booking.total,
          },
    });
    if (updated.count !== 1) {
      return { outcome: "RECONCILIATION_REQUIRED" as const, newResolution: false };
    }

    if (reinstate && availability) {
      await createSeatHolds(tx, {
        bookingId: booking.id,
        roomId: booking.room!.id,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        seatNumbers: availability.availableSeatNumbers.slice(0, booking.guests),
      });
    }

    await tx.latePaymentResolution.create({
      data: {
        bookingId: booking.id,
        sourceWebhookEventId: input.sourceWebhookEventId,
        providerTracker: input.providerTracker,
        reason,
        outcome: reinstate ? "REINSTATED" : "REFUND_REQUIRED",
        amount: booking.total,
        currency: "PKR",
      },
    });

    await tx.notification.createMany({
      data: reinstate
        ? [
            {
              userId: booking.hostel.ownerId,
              type: "BOOKING_REQUEST",
              title: "New paid booking request",
              message: `${booking.user.name} is waiting for your response to a booking request at ${booking.hostel.name}.`,
              bookingId: booking.id,
            },
            {
              userId: booking.userId,
              type: "BOOKING_REQUEST",
              title: "Payment received — booking reinstated",
              message: `Your payment for ${booking.hostel.name} was received and your booking was reinstated. The owner has 24 hours to respond.`,
              bookingId: booking.id,
              hostelId: booking.hostelId,
            },
          ]
        : [{
            userId: booking.userId,
            type: "BOOKING_CANCELLED",
            title: "Late payment refund required",
            message: `We received your payment for ${booking.hostel.name} after cancellation. Your payment is under review for a full refund.`,
            bookingId: booking.id,
            hostelId: booking.hostelId,
          }],
    });

    return {
      outcome: reinstate ? "REINSTATED" as const : "REFUND_REQUIRED" as const,
      newResolution: true,
    };
  }, { isolationLevel: "ReadCommitted" });
}

export async function resolveLatePayment(
  input: LatePaymentInput,
  client: typeof db = db,
): Promise<{ outcome: ResolutionOutcome }> {
  let resolution: Awaited<ReturnType<typeof resolveInTransaction>>;
  try {
    resolution = await resolveInTransaction(input, false, client);
  } catch (error) {
    if (!isSeatHoldConflict(error)) throw error;
    resolution = await resolveInTransaction(input, true, client);
  }

  if (resolution.outcome === "REFUND_REQUIRED" && resolution.newResolution) {
    try {
      await processRefund(input.bookingId, "system:late-payment");
    } catch (error) {
      const summary = getSafeErrorSummary(error);
      logOperationalEvent("error", "payment.late_payment_refund.dispatch_failed", {
        booking_id: input.bookingId,
        error_name: summary.name,
        ...(summary.code ? { error_code: summary.code } : {}),
      });
    }
  }

  return { outcome: resolution.outcome };
}
