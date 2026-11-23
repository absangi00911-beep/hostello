// Path: src/lib/safepay-payment-events.ts
//
// Applies an authenticated, claimed Safepay event to bookings and subscriptions:
// amount and currency checks, payment state, late-payment reconciliation and the
// confirmation-email outbox. Returns an HTTP-style response that the inbox records.
import { NextResponse } from "next/server";
import { recordServerEvent } from "@/lib/analytics/sink";
import { db } from "@/lib/db";
import { resolveLatePayment } from "@/lib/late-payment-resolution";
import { createOperationalLogContext, logOperationalEvent } from "@/lib/operational-logger";
import { enqueuePaymentConfirmationEmails } from "@/lib/payment-email-outbox";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { toSafepayMinorUnits } from "@/lib/safepay";
import {
  isSafepayBookingMethod,
  isValidPkrAmount,
  parseOrderId,
  parseTracker,
} from "@/lib/safepay-event-fields";
import {
  handleFailedSubscriptionPayment,
  handleSubscriptionPayment,
} from "@/lib/safepay-subscription-events";
import type { SafepayEvent } from "@/lib/safepay-webhook-auth";

/**
 * A payment that arrives after an abandoned checkout was cancelled either puts the booking
 * back (REINSTATED: paid and active again, which the funnel counts as a confirmed payment)
 * or has to be refunded because the bed is gone (REFUND_REQUIRED: not a confirmed booking).
 */
async function recordReinstatedPayment(outcome: string, booking: { id: string; hostelId: string }): Promise<void> {
  if (outcome === "REINSTATED") {
    await recordServerEvent("payment_confirmed", { bookingId: booking.id, hostelId: booking.hostelId });
  }
}

export async function processSafepayWebhook(event: SafepayEvent, sourceWebhookEventId: string) {
  const logContext = createOperationalLogContext();
  try {
    if (event.type !== "payment.succeeded" && event.type !== "payment.failed") {
      return NextResponse.json({ received: true });
    }

    const orderId = parseOrderId(event);
    const tracker = parseTracker(event);
    if (!orderId || !tracker) {
      return NextResponse.json({ error: "Payment event is missing its order reference or tracker." }, { status: 400 });
    }

    if (event.type === "payment.failed") {
      if (orderId.startsWith("sub_")) {
        return handleFailedSubscriptionPayment(orderId, tracker, event, logContext);
      }

      const booking = await db.booking.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, paymentStatus: true, paymentMethod: true, transactionId: true, total: true },
      });
      if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
      if (!isSafepayBookingMethod(booking.paymentMethod)) {
        logOperationalEvent("warn", "payment.webhook.ignored", {
          booking_id: booking.id,
          reason: "different_payment_method",
        }, logContext);
        return NextResponse.json({ received: true });
      }
      if (booking.transactionId && booking.transactionId !== tracker) {
        logOperationalEvent("warn", "payment.webhook.ignored", {
          booking_id: booking.id,
          reason: "stale_failed_tracker",
        }, logContext);
        return NextResponse.json({ received: true });
      }
      if (!isValidPkrAmount(event, toSafepayMinorUnits(booking.total))) {
        logOperationalEvent("error", "payment.reconciliation_required", {
          booking_id: booking.id,
          reason: "failed_event_amount_or_currency_mismatch",
        }, logContext);
        return NextResponse.json({ error: "Failed payment amount or currency mismatch." }, { status: 400 });
      }
      const transition = await db.booking.updateMany({
        where: {
          id: orderId,
          status: "PENDING",
          paymentStatus: "PENDING",
          paymentMethod: booking.paymentMethod,
          transactionId: booking.transactionId,
        },
        data: { paymentStatus: "FAILED", transactionId: tracker },
      });
      logOperationalEvent(transition.count === 1 ? "info" : "warn", transition.count === 1
        ? "booking.payment_failed"
        : "payment.webhook.stale_event", {
        booking_id: booking.id,
        reason: transition.count === 1 ? "provider_failed" : "booking_state_changed",
      }, logContext);
      return NextResponse.json({ received: true });
    }

    if (event.data?.state !== "TRACKER_ENDED") {
      return NextResponse.json({ error: "Payment tracker is not in a completed state." }, { status: 400 });
    }

    if (orderId.startsWith("sub_")) {
      return handleSubscriptionPayment(orderId, tracker, event, logContext);
    }

    const booking = await db.booking.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
        hostel: {
          select: {
            name: true,
            slug: true,
            owner: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!booking) {
      logOperationalEvent("error", "payment.reconciliation_required", {
        entity_type: "booking",
        entity_id: orderId,
        reason: "booking_not_found",
      }, logContext);
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (!isSafepayBookingMethod(booking.paymentMethod)) {
      logOperationalEvent("error", "payment.reconciliation_required", {
        booking_id: booking.id,
        reason: "payment_provider_mismatch",
      }, logContext);
      return NextResponse.json({ error: "Payment provider mismatch." }, { status: 409 });
    }

    if (!isValidPkrAmount(event, toSafepayMinorUnits(booking.total))) {
      logOperationalEvent("error", "payment.reconciliation_required", {
        booking_id: booking.id,
        reason: "amount_or_currency_mismatch",
      }, logContext);
      return NextResponse.json({ error: "Amount or currency mismatch — booking held for reconciliation." }, { status: 400 });
    }

    if (booking.transactionId && booking.transactionId !== tracker) {
      logOperationalEvent("error", "payment.reconciliation_required", {
        booking_id: booking.id,
        reason: "provider_reference_mismatch",
      }, logContext);
      return NextResponse.json({ error: "Payment tracker mismatch." }, { status: 409 });
    }

    if (booking.paymentStatus === "PAID") {
      // The exact same tracker is idempotent. A second successful tracker may
      // represent a duplicate charge and must be reconciled out of band.
      if (booking.transactionId === tracker) return NextResponse.json({ received: true });
      logOperationalEvent("error", "payment.reconciliation_required", {
        booking_id: booking.id,
        reason: "additional_successful_payment",
      }, logContext);
      return NextResponse.json({ error: "Additional payment requires reconciliation." }, { status: 409 });
    }

    if (
      booking.status === "CANCELLED" &&
      ["PENDING", "FAILED"].includes(booking.paymentStatus)
    ) {
      const resolution = await resolveLatePayment({
        bookingId: booking.id,
        sourceWebhookEventId,
        providerTracker: tracker,
        amountMinorUnits: event.data?.amount as number,
        currency: event.data?.currency as string,
      });
      if (resolution.outcome === "RECONCILIATION_REQUIRED") {
        logOperationalEvent("error", "payment.reconciliation_required", {
          booking_id: booking.id,
          reason: "late_payment_state_changed",
        }, logContext);
        return NextResponse.json({ error: "Payment requires booking reconciliation." }, { status: 409 });
      }
      await recordReinstatedPayment(resolution.outcome, booking);
      return NextResponse.json({ received: true, latePaymentOutcome: resolution.outcome });
    }

    const canAcceptPayment = booking.status === "PENDING" &&
      (booking.paymentStatus === "PENDING" ||
        (booking.paymentStatus === "FAILED" && booking.transactionId === tracker));
    if (!canAcceptPayment) {
      logOperationalEvent("error", "payment.reconciliation_required", {
        booking_id: booking.id,
        reason: "booking_not_eligible",
      }, logContext);
      return NextResponse.json({ error: "Payment requires booking reconciliation." }, { status: 409 });
    }

    const responseDueAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    // The in-app notifications are written in the same transaction as the PAID
    // transition, so they exist if and only if the transition was applied.
    const notificationRows = [
      {
        userId: booking.hostel.owner.id,
        type: "BOOKING_REQUEST" as const,
        title: "New paid booking request",
        message: `${booking.user.name} is waiting for your response to a booking request at ${booking.hostel.name}.`,
        bookingId: booking.id,
      },
      {
        userId: booking.userId,
        type: "BOOKING_REQUEST" as const,
        title: "Payment received — awaiting owner",
        message: `Your booking request for ${booking.hostel.name} was sent to the owner. They have 24 hours to respond.`,
        bookingId: booking.id,
        hostelId: booking.hostelId,
      },
    ];
    const applyLivePayment = (
      expectedPaymentStatus: typeof booking.paymentStatus,
      expectedTransactionId = booking.transactionId,
    ) => db.$transaction(async (tx) => {
      const updated = await tx.booking.updateMany({
        where: {
          id: orderId,
          paymentMethod: booking.paymentMethod,
          paymentStatus: expectedPaymentStatus,
          status: "PENDING",
          transactionId: expectedTransactionId,
        },
        data: {
          paymentStatus: "PAID",
          transactionId: tracker,
          ownerResponseDueAt: responseDueAt,
          ownerResponseReminderSentAt: null,
        },
      });
      if (updated.count > 0) {
        await tx.notification.createMany({ data: notificationRows });
        await enqueuePaymentConfirmationEmails(tx, {
          bookingId: booking.id,
          studentUserId: booking.userId,
          ownerUserId: booking.hostel.owner.id,
        });
      }
      return updated;
    });

    let transitioned = (await applyLivePayment(booking.paymentStatus)).count === 1;
    if (!transitioned) {
      let latest = await db.booking.findUnique({
        where: { id: orderId },
        select: { status: true, paymentMethod: true, paymentStatus: true, transactionId: true },
      });
      if (latest && isSafepayBookingMethod(latest.paymentMethod) && latest.paymentStatus === "PAID" && latest.transactionId === tracker) {
        return NextResponse.json({ received: true });
      }
      if (
        latest?.status === "PENDING" &&
        latest.paymentStatus === "FAILED" &&
        latest.transactionId === tracker
      ) {
        transitioned = (await applyLivePayment("FAILED", tracker)).count === 1;
        if (!transitioned) {
          latest = await db.booking.findUnique({
            where: { id: orderId },
            select: { status: true, paymentMethod: true, paymentStatus: true, transactionId: true },
          });
          if (latest && isSafepayBookingMethod(latest.paymentMethod) && latest.paymentStatus === "PAID" && latest.transactionId === tracker) {
            return NextResponse.json({ received: true });
          }
        }
      }

      if (
        !transitioned &&
        latest?.status === "CANCELLED" &&
        ["PENDING", "FAILED"].includes(latest.paymentStatus) &&
        isSafepayBookingMethod(latest.paymentMethod) &&
        (!latest.transactionId || latest.transactionId === tracker)
      ) {
        const resolution = await resolveLatePayment({
          bookingId: orderId,
          sourceWebhookEventId,
          providerTracker: tracker,
          amountMinorUnits: event.data?.amount as number,
          currency: event.data?.currency as string,
        });
        if (resolution.outcome !== "RECONCILIATION_REQUIRED") {
          await recordReinstatedPayment(resolution.outcome, booking);
          return NextResponse.json({ received: true, latePaymentOutcome: resolution.outcome });
        }
      }

      if (!transitioned) {
        logOperationalEvent("warn", "payment.webhook.concurrent_state_change", {
          booking_id: booking.id,
        }, logContext);
        return NextResponse.json({ error: "Booking changed during payment confirmation." }, { status: 409 });
      }
    }

    logOperationalEvent("info", "booking.payment_confirmed", {
      booking_id: booking.id,
      booking_status: "PENDING",
      owner_response_due_at: responseDueAt.toISOString(),
    }, logContext);
    await recordServerEvent("payment_confirmed", { bookingId: booking.id, hostelId: booking.hostelId });


    return NextResponse.json({ received: true });
  } catch (err) {
    const summary = getSafeErrorSummary(err);
    logOperationalEvent("error", "payment.webhook.processing_failed", {
      error_name: summary.name,
      ...(summary.code ? { error_code: summary.code } : {}),
      ...(summary.status ? { error_status: summary.status } : {}),
    }, logContext);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
