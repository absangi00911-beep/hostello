// Path: src/lib/safepay-webhook-inbox.ts
//
// The webhook inbox: durable record of every authenticated event, with the state machine
// (RECEIVED, QUEUED, PROCESSING, RETRYABLE, terminal) that makes delivery idempotent.
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { parseOrderId, parseTracker } from "@/lib/safepay-event-fields";
import { MAX_TRACKER_LENGTH, type SafepayEvent } from "@/lib/safepay-webhook-auth";

export type SafepayEventReservation = {
  id: string;
  duplicate: boolean;
  inProgress: boolean;
};

export async function reserveSafepayEvent(
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

export async function claimSafepayEvent(id: string) {
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

export async function finishSafepayEvent(
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
