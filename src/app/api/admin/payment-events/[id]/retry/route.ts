import { Client } from "@upstash/qstash";
import { z } from "zod";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import { readBoundedJson } from "@/lib/bounded-json";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { rateLimit } from "@/lib/rate-limit";
import { isBoundedRouteParam } from "@/lib/route-params";

const MAX_BODY_BYTES = 2_048;
const retrySchema = z.object({
  providerChecked: z.literal(true),
  providerTracker: z.string().trim().min(1).max(256),
  reason: z.string().trim().min(20).max(500),
}).strict();

type StoredSafepayEvent = {
  type?: unknown;
  data?: {
    tracker?: unknown;
    metadata?: { order_id?: unknown };
  };
};

function isReplayableEvidence(
  evidence: unknown,
  expected: { eventType: string; tracker: string | null; orderId: string | null },
): evidence is StoredSafepayEvent {
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) return false;
  const event = evidence as StoredSafepayEvent;
  return (event.type === "payment.succeeded" || event.type === "payment.failed") &&
    event.type === expected.eventType &&
    typeof event.data?.tracker === "string" &&
    event.data.tracker === expected.tracker &&
    typeof event.data.metadata?.order_id === "string" &&
    event.data.metadata.order_id === expected.orderId;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const actionLimit = await rateLimit(`admin-webhook-retry:${session.user.id}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!actionLimit.ok) {
    return NextResponse.json(
      { error: "Too many payment-event retries. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, Math.ceil((actionLimit.resetAt - Date.now()) / 1000))) },
      },
    );
  }

  const { id } = await params;
  if (!isBoundedRouteParam(id)) {
    return NextResponse.json({ error: "Invalid payment event." }, { status: 400 });
  }

  const boundedBody = await readBoundedJson(req, MAX_BODY_BYTES);
  if (!boundedBody.ok) {
    return NextResponse.json({ error: boundedBody.error }, { status: boundedBody.status });
  }
  const body = retrySchema.safeParse(boundedBody.data);
  if (!body.success) {
    return NextResponse.json({ error: "Enter a reason and verify the exact Safepay tracker before retrying." }, { status: 400 });
  }

  if (
    !process.env.QSTASH_TOKEN ||
    !process.env.QSTASH_CURRENT_SIGNING_KEY ||
    !process.env.QSTASH_NEXT_SIGNING_KEY
  ) {
    return NextResponse.json({ error: "Webhook retry is unavailable because QStash is not fully configured." }, { status: 503 });
  }

  try {
    const event = await db.safepayWebhookEvent.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        eventType: true,
        merchantOrderId: true,
        tracker: true,
        lastErrorCode: true,
        payloadEvidence: true,
      },
    });
    if (!event) return NextResponse.json({ error: "Payment event not found." }, { status: 404 });
    if (event.status !== "RETRYABLE") {
      return NextResponse.json(
        { error: event.status === "RECONCILIATION_REQUIRED"
          ? "This event needs manual reconciliation and cannot be replayed."
          : "This event is no longer eligible for retry." },
        { status: 409 },
      );
    }
    if (!event.tracker || body.data.providerTracker !== event.tracker) {
      return NextResponse.json({ error: "The Safepay tracker must exactly match the stored event." }, { status: 400 });
    }
    if (event.lastErrorCode === "invalid_stored_event") {
      return NextResponse.json({ error: "Stored event evidence is invalid and cannot be retried." }, { status: 409 });
    }

    let evidence: unknown;
    try {
      evidence = JSON.parse(event.payloadEvidence);
    } catch {
      evidence = null;
    }
    if (!isReplayableEvidence(evidence, {
      eventType: event.eventType,
      tracker: event.tracker,
      orderId: event.merchantOrderId,
    })) {
      return NextResponse.json({ error: "Stored event evidence is incomplete and cannot be retried." }, { status: 409 });
    }

    const claimed = await db.$transaction(async (tx) => {
      const transition = await tx.safepayWebhookEvent.updateMany({
        where: { id, status: "RETRYABLE" },
        data: { status: "QUEUED", lastErrorCode: null },
      });
      if (transition.count !== 1) return false;

      await tx.safepayWebhookReplayEvent.create({
        data: {
          webhookEventId: id,
          adminUserId: session.user.id,
          providerTracker: body.data.providerTracker,
          reason: body.data.reason,
        },
      });
      return true;
    });
    if (!claimed) {
      return NextResponse.json({ error: "Another request changed this event. Refresh the queue." }, { status: 409 });
    }

    try {
      const qstash = new Client({ token: process.env.QSTASH_TOKEN });
      await qstash.publishJSON({
        url: `${getAppUrl()}/api/payment/webhook`,
        failureCallback: `${getAppUrl()}/api/payment/webhook/failure`,
        body: { eventId: id },
        retries: 5,
      });
    } catch (error) {
      await db.safepayWebhookEvent.updateMany({
        where: { id, status: "QUEUED" },
        data: { status: "RETRYABLE", lastErrorCode: "admin_retry_enqueue_failed" },
      }).catch(() => undefined);
      console.error("[POST /api/admin/payment-events/[id]/retry]", getSafeErrorSummary(error));
      return NextResponse.json({ error: "QStash did not accept the retry. The event remains available for review." }, { status: 503 });
    }

    return NextResponse.json({ queued: true }, { status: 202 });
  } catch (error) {
    console.error("[POST /api/admin/payment-events/[id]/retry]", getSafeErrorSummary(error));
    return NextResponse.json({ error: "Could not queue this payment event." }, { status: 500 });
  }
}
