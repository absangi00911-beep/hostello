// Path: src/app/api/payment/webhook/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { toSafepayMinorUnits, verifyWebhookSignature } from "@/lib/safepay";
import { sendEmail } from "@/lib/email";
import { bookingStatusEmail } from "@/lib/email-templates/booking-status";
import { createNotification } from "@/lib/notifications";
import { PLANS } from "@/config/plans";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { readBoundedText } from "@/lib/bounded-json";
import { createOperationalLogContext, logOperationalEvent, type OperationalLogContext } from "@/lib/operational-logger";

const MAX_WEBHOOK_BODY_BYTES = 64 * 1024;
const MAX_ORDER_ID_LENGTH = 128;
const MAX_TRACKER_LENGTH = 256;

type SafepayEvent = {
  type?: unknown;
  merchant_api_key?: unknown;
  data?: {
    tracker?: unknown;
    state?: unknown;
    amount?: unknown;
    currency?: unknown;
    metadata?: { order_id?: unknown };
  };
};

function parseOrderId(event: SafepayEvent): string | null {
  const orderId = event.data?.metadata?.order_id;
  return typeof orderId === "string" && orderId.length > 0 && orderId.length <= MAX_ORDER_ID_LENGTH
    ? orderId
    : null;
}

function parseTracker(event: SafepayEvent): string | null {
  const tracker = event.data?.tracker;
  return typeof tracker === "string" && tracker.length > 0 && tracker.length <= MAX_TRACKER_LENGTH
    ? tracker
    : null;
}

function isSafepayBookingMethod(paymentMethod: string | null): boolean {
  // Older bookings may predate the payment-method field; checkout defaults
  // those to Safepay. Explicit assignments to another provider must not settle
  // through this webhook.
  return paymentMethod === null || paymentMethod === "safepay";
}

function isValidPkrAmount(event: SafepayEvent, expected: number): boolean {
  return event.data?.currency === "PKR" &&
    typeof event.data.amount === "number" &&
    Number.isSafeInteger(event.data.amount) &&
    event.data.amount === expected;
}

async function handleSubscriptionPayment(
  orderId: string,
  tracker: string,
  event: SafepayEvent,
  logContext: OperationalLogContext,
) {
  const subscriptionId = orderId.slice("sub_".length);
  if (!subscriptionId || !isValidPkrAmount(event, toSafepayMinorUnits(PLANS.PRO.price))) {
    logOperationalEvent("error", "payment.reconciliation_required", {
      entity_type: "subscription",
      entity_id: subscriptionId || "unknown",
      reason: "amount_or_reference_invalid",
    }, logContext);
    return NextResponse.json({ error: "Subscription payment amount or reference is invalid." }, { status: 400 });
  }

  const subscription = await db.subscription.findUnique({
    where: { id: subscriptionId },
    select: { id: true, userId: true, status: true, paymentRef: true },
  });
  if (!subscription) {
    logOperationalEvent("error", "payment.reconciliation_required", {
      entity_type: "subscription",
      entity_id: subscriptionId,
      reason: "subscription_not_found",
    }, logContext);
    return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
  }

  if (subscription.status === "ACTIVE" && subscription.paymentRef === tracker) {
    return NextResponse.json({ received: true });
  }
  if (subscription.status !== "PENDING" || subscription.paymentRef !== tracker) {
    logOperationalEvent("error", "payment.reconciliation_required", {
      entity_type: "subscription",
      entity_id: subscriptionId,
      reason: "subscription_reference_mismatch",
    }, logContext);
    return NextResponse.json({ error: "Subscription payment requires reconciliation." }, { status: 409 });
  }

  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 1);

  const activated = await db.$transaction(async (tx) => {
    const result = await tx.subscription.updateMany({
      where: { id: subscriptionId, status: "PENDING", paymentRef: tracker },
      data: { status: "ACTIVE", startDate: now, endDate },
    });
    if (result.count === 0) return false;
    await tx.user.update({ where: { id: subscription.userId }, data: { plan: "PRO" } });
    return true;
  });

  if (activated) {
    createNotification({
      userId: subscription.userId,
      type: "HOSTEL_APPROVED",
      title: "Welcome to HostelLo Pro 🎉",
      message: "Your Pro subscription is now active. Unlimited listings and featured placement are enabled.",
      logContext,
    }).catch((err) => {
      const summary = getSafeErrorSummary(err);
      logOperationalEvent("error", "notification.dispatch_failed", {
        notification_type: "HOSTEL_APPROVED",
        error_name: summary.name,
        ...(summary.code ? { error_code: summary.code } : {}),
      }, logContext);
    });
  }

  if (activated) {
    logOperationalEvent("info", "subscription.payment_activated", {
      subscription_id: subscriptionId,
    }, logContext);
  }

  return NextResponse.json({ received: true });
}

export async function POST(req: NextRequest) {
  const logContext = createOperationalLogContext(req);
  try {
    const boundedBody = await readBoundedText(req, MAX_WEBHOOK_BODY_BYTES);
    if (!boundedBody.ok) {
      return NextResponse.json({ error: boundedBody.error }, { status: boundedBody.status });
    }
    const rawBody = boundedBody.text;
    const signature = req.headers.get("x-sfpy-signature") ?? "";

    if (!(await verifyWebhookSignature(rawBody, signature))) {
      logOperationalEvent("warn", "payment.webhook.rejected", { reason: "invalid_signature" }, logContext);
      return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
    }

    const event = JSON.parse(rawBody) as SafepayEvent;
    if (!process.env.SAFEPAY_API_KEY || event.merchant_api_key !== process.env.SAFEPAY_API_KEY) {
      logOperationalEvent("warn", "payment.webhook.rejected", { reason: "merchant_key_mismatch" }, logContext);
      return NextResponse.json({ error: "Merchant key mismatch." }, { status: 401 });
    }

    if (event.type !== "payment.succeeded" && event.type !== "payment.failed") {
      return NextResponse.json({ received: true });
    }

    const orderId = parseOrderId(event);
    const tracker = parseTracker(event);
    if (!orderId || !tracker) {
      return NextResponse.json({ error: "Payment event is missing its order reference or tracker." }, { status: 400 });
    }

    if (event.type === "payment.failed") {
      if (orderId.startsWith("sub_")) return NextResponse.json({ received: true });

      const booking = await db.booking.findUnique({
        where: { id: orderId },
        select: { id: true, status: true, paymentStatus: true, paymentMethod: true, transactionId: true },
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
        hostel: { select: { name: true, slug: true } },
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

    if (booking.paymentStatus !== "PENDING" || !["PENDING", "CANCELLED"].includes(booking.status)) {
      logOperationalEvent("error", "payment.reconciliation_required", {
        booking_id: booking.id,
        reason: "booking_not_eligible",
      }, logContext);
      return NextResponse.json({ error: "Payment requires booking reconciliation." }, { status: 409 });
    }

    const wasCancelled = booking.status === "CANCELLED";
    const result = await db.booking.updateMany({
      where: {
        id: orderId,
        paymentMethod: booking.paymentMethod,
        paymentStatus: "PENDING",
        status: booking.status,
        transactionId: booking.transactionId,
      },
      data: {
        paymentStatus: "PAID",
        transactionId: tracker,
        ...(wasCancelled ? {} : { status: "CONFIRMED" }),
      },
    });

    if (result.count === 0) {
      const latest = await db.booking.findUnique({
        where: { id: orderId },
        select: { paymentMethod: true, paymentStatus: true, transactionId: true },
      });
      if (latest && isSafepayBookingMethod(latest.paymentMethod) && latest.paymentStatus === "PAID" && latest.transactionId === tracker) {
        return NextResponse.json({ received: true });
      }
      logOperationalEvent("warn", "payment.webhook.concurrent_state_change", {
        booking_id: booking.id,
      }, logContext);
      return NextResponse.json({ error: "Booking changed during payment confirmation." }, { status: 409 });
    }

    if (wasCancelled) {
      logOperationalEvent("error", "payment.reconciliation_required", {
        booking_id: booking.id,
        reason: "payment_after_cancellation",
      }, logContext);
      return NextResponse.json({ received: true, reconciliationRequired: true });
    }

    logOperationalEvent("info", "booking.payment_confirmed", {
      booking_id: booking.id,
      booking_status: "CONFIRMED",
    }, logContext);

    void sendEmail(
      bookingStatusEmail({
        studentName: booking.user.name,
        studentEmail: booking.user.email,
        hostelName: booking.hostel.name,
        hostelSlug: booking.hostel.slug,
        bookingId: booking.id,
        status: "CONFIRMED",
      }),
    ).then((delivery) => {
      if (!delivery.success) {
        logOperationalEvent("error", "notification.dispatch_failed", {
          notification_type: "BOOKING_CONFIRMED_EMAIL",
          booking_id: booking.id,
          reason: "provider_rejected",
        }, logContext);
      }
    }).catch((err) => {
      const summary = getSafeErrorSummary(err);
      logOperationalEvent("error", "notification.dispatch_failed", {
        notification_type: "BOOKING_CONFIRMED_EMAIL",
        booking_id: booking.id,
        error_name: summary.name,
        ...(summary.code ? { error_code: summary.code } : {}),
      }, logContext);
    });

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
