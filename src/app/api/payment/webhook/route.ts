// Path: src/app/api/payment/webhook/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { Client } from "@upstash/qstash";
import { db } from "@/lib/db";
import { toSafepayMinorUnits, verifyWebhookSignature } from "@/lib/safepay";
import { getAppUrl } from "@/lib/app-url";
import { verifyUpstashRequest } from "@/lib/verify-upstash";
import { sendEmail } from "@/lib/email";
import { bookingConfirmationEmail, bookingNotificationEmail } from "@/lib/email-templates/booking";
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

type SafepayEventReservation = {
  id: string;
  duplicate: boolean;
  inProgress: boolean;
};

async function reserveSafepayEvent(
  rawBody: string,
  event: SafepayEvent,
): Promise<SafepayEventReservation> {
  const bodyHash = createHash("sha256").update(rawBody).digest("hex");
  const data = event.data;
  const amount = data?.amount;
  const safeType = typeof event.type === "string" && event.type.length <= 128 ? event.type : "unknown";
  const evidence = {
    type: safeType,
    merchant_api_key: "[REDACTED]",
    data: {
      tracker: typeof data?.tracker === "string" && data.tracker.length <= MAX_TRACKER_LENGTH ? data.tracker : null,
      state: typeof data?.state === "string" && data.state.length <= 64 ? data.state : null,
      amount: typeof amount === "number" && Number.isSafeInteger(amount) && amount >= 0 && amount <= 2_147_483_647
        ? amount
        : null,
      currency: typeof data?.currency === "string" && data.currency.length <= 8 ? data.currency : null,
      metadata: { order_id: parseOrderId(event) },
    },
  };

  await db.safepayWebhookEvent.createMany({
    data: [{
      bodyHash,
      eventType: safeType,
      merchantOrderId: parseOrderId(event),
      tracker: parseTracker(event),
      providerState: typeof data?.state === "string" ? data.state.slice(0, 64) : null,
      amountMinorUnits: typeof amount === "number" && Number.isSafeInteger(amount) && amount >= 0 && amount <= 2_147_483_647
        ? amount
        : null,
      currency: typeof data?.currency === "string" && data.currency.length <= 8 ? data.currency : null,
      payloadEvidence: JSON.stringify(evidence),
    }],
    skipDuplicates: true,
  });

  const existing = await db.safepayWebhookEvent.findUnique({
    where: { bodyHash },
    select: { id: true, status: true, processingStartedAt: true },
  });
  if (!existing) throw new Error("Safepay webhook event was not persisted.");

  if (["PROCESSED", "RECONCILIATION_REQUIRED", "IGNORED"].includes(existing.status)) {
    return { id: existing.id, duplicate: true, inProgress: false };
  }
  if (existing.status === "QUEUED") {
    return { id: existing.id, duplicate: true, inProgress: false };
  }

  const staleBefore = new Date(Date.now() - 5 * 60 * 1000);
  if (
    existing.status === "PROCESSING" &&
    existing.processingStartedAt &&
    existing.processingStartedAt > staleBefore
  ) {
    return { id: existing.id, duplicate: false, inProgress: true };
  }
  return { id: existing.id, duplicate: false, inProgress: false };
}

async function claimSafepayEvent(id: string) {
  const staleBefore = new Date(Date.now() - 5 * 60 * 1000);
  const claimToken = new Date();
  const claimed = await db.safepayWebhookEvent.updateMany({
    where: {
      id,
      OR: [
        { status: { in: ["RECEIVED", "QUEUED", "RETRYABLE"] } },
        {
          status: "PROCESSING",
          OR: [{ processingStartedAt: null }, { processingStartedAt: { lt: staleBefore } }],
        },
      ],
    },
    data: {
      status: "PROCESSING",
      processingAttempts: { increment: 1 },
      processingStartedAt: claimToken,
      lastErrorCode: null,
    },
  });
  if (claimed.count === 0) {
    const current = await db.safepayWebhookEvent.findUnique({
      where: { id },
      select: { status: true, processingStartedAt: true },
    });
    if (
      current?.status === "PROCESSING" &&
      current.processingStartedAt &&
      current.processingStartedAt > staleBefore
    ) {
      return { inProgress: true as const };
    }
    return null;
  }

  try {
    const stored = await db.safepayWebhookEvent.findUnique({
      where: { id },
      select: { payloadEvidence: true },
    });
    if (!stored) throw new Error("Safepay webhook event was not found after claim.");

    const event: unknown = JSON.parse(stored.payloadEvidence);
    if (!event || typeof event !== "object" || Array.isArray(event)) {
      throw new Error("Stored Safepay webhook evidence is invalid.");
    }
    return { event: event as SafepayEvent, claimToken };
  } catch (err) {
    await db.safepayWebhookEvent.updateMany({
      where: { id, status: "PROCESSING", processingStartedAt: claimToken },
      data: { status: "RETRYABLE", processingStartedAt: null, lastErrorCode: "invalid_stored_event" },
    }).catch(() => undefined);
    throw err;
  }
}

async function finishSafepayEvent(
  id: string,
  claimToken: Date,
  response: NextResponse,
  ignored = false,
): Promise<NextResponse> {
  const responseBody = await response.clone().json().catch(() => null) as { reconciliationRequired?: unknown } | null;
  const status = response.status >= 500
    ? "RETRYABLE"
    : ignored
      ? "IGNORED"
      : response.status >= 400 || responseBody?.reconciliationRequired === true
        ? "RECONCILIATION_REQUIRED"
        : "PROCESSED";

  await db.safepayWebhookEvent.updateMany({
    where: { id, status: "PROCESSING", processingStartedAt: claimToken },
    data: {
      status,
      processingStartedAt: null,
      ...(status === "RETRYABLE" ? {} : { processedAt: new Date() }),
    },
  });
  return response;
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

async function processSafepayWebhook(event: SafepayEvent) {
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
      if (orderId.startsWith("sub_")) return NextResponse.json({ received: true });

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

    if (booking.paymentStatus !== "PENDING" || !["PENDING", "CANCELLED"].includes(booking.status)) {
      logOperationalEvent("error", "payment.reconciliation_required", {
        booking_id: booking.id,
        reason: "booking_not_eligible",
      }, logContext);
      return NextResponse.json({ error: "Payment requires booking reconciliation." }, { status: 409 });
    }

    const wasCancelled = booking.status === "CANCELLED";
    const responseDueAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
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
        ...(!wasCancelled
          ? { ownerResponseDueAt: responseDueAt, ownerResponseReminderSentAt: null }
          : {}),
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
      booking_status: "PENDING",
      owner_response_due_at: responseDueAt.toISOString(),
    }, logContext);

    const bookingEmailProps = {
      studentName: booking.user.name,
      studentEmail: booking.user.email,
      ownerName: booking.hostel.owner.name,
      ownerEmail: booking.hostel.owner.email,
      hostelName: booking.hostel.name,
      hostelSlug: booking.hostel.slug,
      bookingId: booking.id,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      months: booking.months,
      total: booking.total,
      paymentMethod: booking.paymentMethod ?? "Safepay",
    };

    const emailTypes = ["BOOKING_REQUEST_EMAIL_TO_OWNER", "BOOKING_REQUEST_EMAIL_TO_STUDENT"] as const;
    const emailResults = await Promise.allSettled([
      sendEmail(bookingNotificationEmail(bookingEmailProps)),
      sendEmail(bookingConfirmationEmail(bookingEmailProps)),
    ]);
    emailResults.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value.success) return;
      const summary = result.status === "rejected" ? getSafeErrorSummary(result.reason) : null;
      logOperationalEvent("error", "notification.dispatch_failed", {
        notification_type: emailTypes[index],
        booking_id: booking.id,
        ...(summary
          ? { error_name: summary.name, ...(summary.code ? { error_code: summary.code } : {}) }
          : { reason: "provider_rejected" }),
      }, logContext);
    });

    void createNotification({
      userId: booking.hostel.owner.id,
      type: "BOOKING_REQUEST",
      title: "New paid booking request",
      message: `${booking.user.name} is waiting for your response to a booking request at ${booking.hostel.name}.`,
      bookingId: booking.id,
    });
    void createNotification({
      userId: booking.userId,
      type: "BOOKING_REQUEST",
      title: "Payment received — awaiting owner",
      message: `Your booking request for ${booking.hostel.name} was sent to the owner. They have 24 hours to respond.`,
      bookingId: booking.id,
      hostelId: booking.hostelId,
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

async function processQueuedSafepayEvent(req: NextRequest) {
  try {
    await verifyUpstashRequest(req, { acceptBearerToken: false });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const boundedBody = await readBoundedText(req, 4 * 1024);
  if (!boundedBody.ok) {
    return NextResponse.json({ error: boundedBody.error }, { status: boundedBody.status });
  }

  let eventId: string;
  try {
    const parsed: unknown = JSON.parse(boundedBody.text);
    if (
      !parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
      typeof (parsed as { eventId?: unknown }).eventId !== "string" ||
      (parsed as { eventId: string }).eventId.length === 0 ||
      (parsed as { eventId: string }).eventId.length > 128
    ) {
      return NextResponse.json({ error: "Invalid queued event." }, { status: 400 });
    }
    eventId = (parsed as { eventId: string }).eventId;
  } catch {
    return NextResponse.json({ error: "Invalid queued event." }, { status: 400 });
  }

  let claimToken: Date | null = null;
  try {
    const claimed = await claimSafepayEvent(eventId);
    if (!claimed) {
      // A terminal event already owns this ID.
      return NextResponse.json({ received: true, duplicate: true });
    }
    if ("inProgress" in claimed) {
      return NextResponse.json({ error: "Webhook event is already processing." }, { status: 503 });
    }
    claimToken = claimed.claimToken;

    const response = await processSafepayWebhook(claimed.event);
    const ignored = claimed.event.type !== "payment.succeeded" && claimed.event.type !== "payment.failed";
    await finishSafepayEvent(eventId, claimToken, response, ignored);
    if (response.status >= 500) {
      return NextResponse.json({ error: "Webhook processing should be retried." }, { status: 503 });
    }
    // Reconciliation outcomes are recorded durably; acknowledge them to QStash
    // so an invalid business event is not retried as a transient failure.
    return NextResponse.json({ received: true });
  } catch (err) {
    const summary = getSafeErrorSummary(err);
    if (claimToken) {
      await db.safepayWebhookEvent.updateMany({
        where: { id: eventId, status: "PROCESSING", processingStartedAt: claimToken },
        data: {
          status: "RETRYABLE",
          processingStartedAt: null,
          lastErrorCode: (summary.code ?? summary.name).slice(0, 64),
        },
      }).catch(() => undefined);
    }
    logOperationalEvent("error", "payment.webhook.worker_failed", {
      error_name: summary.name,
      ...(summary.code ? { error_code: summary.code } : {}),
      ...(summary.status ? { error_status: summary.status } : {}),
    }, createOperationalLogContext(req));
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 503 });
  }
}

/** Persist each authenticated event before queuing its payment-state changes. */
async function receiveSafepayWebhook(req: NextRequest) {
  const boundedBody = await readBoundedText(req.clone(), MAX_WEBHOOK_BODY_BYTES);
  if (!boundedBody.ok) {
    return NextResponse.json({ error: boundedBody.error }, { status: boundedBody.status });
  }

  const rawBody = boundedBody.text;
  const signature = req.headers.get("x-sfpy-signature") ?? "";
  if (!(await verifyWebhookSignature(rawBody, signature))) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: SafepayEvent;
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Invalid webhook event." }, { status: 400 });
    }
    event = parsed as SafepayEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook event." }, { status: 400 });
  }

  if (!process.env.SAFEPAY_API_KEY || event.merchant_api_key !== process.env.SAFEPAY_API_KEY) {
    return NextResponse.json({ error: "Merchant key mismatch." }, { status: 401 });
  }

  const orderId = event.data?.metadata?.order_id;
  const tracker = event.data?.tracker;
  if (
    (typeof orderId === "string" && orderId.length > MAX_ORDER_ID_LENGTH) ||
    (typeof tracker === "string" && tracker.length > MAX_TRACKER_LENGTH)
  ) {
    return NextResponse.json({ error: "Invalid webhook event." }, { status: 400 });
  }

  let reservation: SafepayEventReservation | null = null;
  let claimToken: Date | null = null;
  try {
    reservation = await reserveSafepayEvent(rawBody, event);
    if (reservation.duplicate) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    if (reservation.inProgress) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    if (process.env.QSTASH_TOKEN) {
      const qstash = new Client({ token: process.env.QSTASH_TOKEN });
      await qstash.publishJSON({
        url: `${getAppUrl()}/api/payment/webhook`,
        failureCallback: `${getAppUrl()}/api/payment/webhook/failure`,
        body: { eventId: reservation.id },
        retries: 5,
      });
      await db.safepayWebhookEvent.updateMany({
        where: { id: reservation.id, status: { in: ["RECEIVED", "RETRYABLE"] } },
        data: { status: "QUEUED" },
      });
      return NextResponse.json({ received: true });
    }

    if (process.env.NODE_ENV === "production") {
      throw new Error("Safepay webhook queue is not configured.");
    }

    // Keep local development usable without QStash. Production never processes
    // a webhook inline when durable queue delivery is unavailable.
    const claimed = await claimSafepayEvent(reservation.id);
    if (!claimed) return NextResponse.json({ received: true, duplicate: true });
    if ("inProgress" in claimed) {
      return NextResponse.json({ error: "Webhook event is already processing." }, { status: 503 });
    }
    claimToken = claimed.claimToken;
    const response = await processSafepayWebhook(claimed.event);
    const ignored = claimed.event.type !== "payment.succeeded" && claimed.event.type !== "payment.failed";
    return await finishSafepayEvent(reservation.id, claimed.claimToken, response, ignored);
  } catch (err) {
    const summary = getSafeErrorSummary(err);
    if (reservation && claimToken) {
      await db.safepayWebhookEvent.updateMany({
        where: { id: reservation.id, status: "PROCESSING", processingStartedAt: claimToken },
        data: {
          status: "RETRYABLE",
          processingStartedAt: null,
          lastErrorCode: (summary.code ?? summary.name).slice(0, 64),
        },
      }).catch(() => undefined);
    } else if (reservation && !reservation.duplicate && !reservation.inProgress) {
      await db.safepayWebhookEvent.updateMany({
        where: { id: reservation.id, status: { in: ["RECEIVED", "QUEUED"] } },
        data: {
          status: "RETRYABLE",
          processingStartedAt: null,
          lastErrorCode: (summary.code ?? summary.name).slice(0, 64),
        },
      }).catch(() => undefined);
    }
    logOperationalEvent("error", "payment.webhook.inbox_failed", {
      error_name: summary.name,
      ...(summary.code ? { error_code: summary.code } : {}),
      ...(summary.status ? { error_status: summary.status } : {}),
    }, createOperationalLogContext(req));
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (req.headers.has("upstash-signature")) {
    return processQueuedSafepayEvent(req);
  }
  return receiveSafepayWebhook(req);
}
