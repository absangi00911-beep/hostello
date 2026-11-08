import { db } from "@/lib/db";
import { processRefund } from "@/lib/refunds";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { logOperationalEvent } from "@/lib/operational-logger";

const BATCH_SIZE = 100;

export async function sweepCancelledRefunds(limit = BATCH_SIZE) {
  const candidates = await db.booking.findMany({
    where: {
      status: "CANCELLED",
      paymentStatus: { in: ["PAID", "PARTIALLY_REFUNDED"] },
      refundState: { in: ["NONE", "PARTIALLY_REFUNDED"] },
      // Only bookings where part of the approved refund is still owed. A
      // finished partial-policy refund stays PARTIALLY_REFUNDED forever, so
      // without this it would match on every run, sort to the front of the
      // oldest-first batch (its updatedAt never changes), and once enough
      // accumulate they would fill the whole batch and starve every booking
      // that genuinely needs a refund.
      refundedAmount: { lt: db.booking.fields.total },
      OR: [
        { cancellationRefundAmount: null },
        {
          cancellationRefundAmount: { gt: 0 },
          refundedAmount: { lt: db.booking.fields.cancellationRefundAmount },
        },
      ],
    },
    orderBy: [{ updatedAt: "asc" }, { id: "asc" }],
    take: Math.max(1, Math.min(BATCH_SIZE, limit)),
    select: {
      id: true,
      total: true,
      cancellationRefundAmount: true,
      refundedAmount: true,
      transactionId: true,
    },
  });

  if (candidates.length === 0) {
    return { scanned: 0, attempted: 0, refunded: 0, unconfirmed: 0, skipped: 0 };
  }

  const processingEvents = await db.safepayWebhookEvent.findMany({
    where: {
      status: { in: ["RECEIVED", "QUEUED", "PROCESSING", "RETRYABLE", "RECONCILIATION_REQUIRED"] },
      eventType: "payment.succeeded",
      merchantOrderId: { in: candidates.map((booking) => booking.id) },
      tracker: { in: candidates.flatMap((booking) => booking.transactionId ? [booking.transactionId] : []) },
    },
    select: { merchantOrderId: true, tracker: true },
  });
  const evaluatingBookings = new Set(processingEvents.flatMap((event) => {
    const booking = candidates.find((candidate) =>
      candidate.id === event.merchantOrderId && candidate.transactionId === event.tracker,
    );
    return booking ? [booking.id] : [];
  }));

  let attempted = 0;
  let refunded = 0;
  let unconfirmed = 0;
  let skipped = 0;
  for (const booking of candidates) {
    const approvedAmount = Math.min(
      booking.total,
      booking.cancellationRefundAmount ?? booking.total,
    );
    if (
      evaluatingBookings.has(booking.id) ||
      approvedAmount - booking.refundedAmount <= 0
    ) {
      skipped++;
      continue;
    }

    attempted++;
    try {
      const result = await processRefund(booking.id, "system:cancelled-refund-sweeper");
      if (result.automatic) refunded++;
      else unconfirmed++;
    } catch (error) {
      unconfirmed++;
      const summary = getSafeErrorSummary(error);
      logOperationalEvent("warn", "payment.refund_sweep.claim_unavailable", {
        booking_id: booking.id,
        error_name: summary.name,
        ...(summary.code ? { error_code: summary.code } : {}),
      });
    }
  }

  return { scanned: candidates.length, attempted, refunded, unconfirmed, skipped };
}
