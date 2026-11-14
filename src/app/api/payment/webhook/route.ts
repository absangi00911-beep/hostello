// Path: src/app/api/payment/webhook/route.ts
//
// Safepay webhook endpoint. Authentication is in safepay-webhook-auth, the durable inbox in
// safepay-webhook-inbox, and the payment-state changes in safepay-payment-events; this
// file only receives, enqueues and acknowledges.
import { type NextRequest, NextResponse } from "next/server";
import { Client } from "@upstash/qstash";
import { getAppUrl } from "@/lib/app-url";
import { db } from "@/lib/db";
import { createOperationalLogContext, logOperationalEvent } from "@/lib/operational-logger";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { processSafepayWebhook } from "@/lib/safepay-payment-events";
import {
  authenticateQueuedSafepayRequest,
  authenticateSafepayWebhook,
} from "@/lib/safepay-webhook-auth";
import {
  claimSafepayEvent,
  finishSafepayEvent,
  reserveSafepayEvent,
  type SafepayEventReservation,
} from "@/lib/safepay-webhook-inbox";

async function processQueuedSafepayEvent(req: NextRequest) {
  const auth = await authenticateQueuedSafepayRequest(req);
  if (!auth.ok) return auth.response;
  const { eventId } = auth;

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

    const response = await processSafepayWebhook(claimed.event, eventId);
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
  const auth = await authenticateSafepayWebhook(req);
  if (!auth.ok) return auth.response;
  const { rawBody, event } = auth;

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
    const response = await processSafepayWebhook(claimed.event, reservation.id);
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
