// Path: src/lib/safepay-webhook-auth.ts
//
// Authentication of the two kinds of request the Safepay webhook route receives:
//
//   1. Safepay -> us: HMAC-signed JSON (x-sfpy-signature) that also carries our merchant key.
//   2. QStash -> us: our own queued job (upstash-signature) naming a stored event ID.
//
// Nothing here touches the database or changes payment state. Every failure is an
// ordinary HTTP response, so the route can return it unchanged. This is the security
// boundary of the webhook; keep it small and keep its tests independent of the handlers.
import { type NextRequest, NextResponse } from "next/server";
import { readBoundedText } from "@/lib/bounded-json";
import { verifyWebhookSignature } from "@/lib/safepay";
import { safeSecretEqual } from "@/lib/secret-compare";
import { verifyUpstashRequest } from "@/lib/verify-upstash";

export const MAX_WEBHOOK_BODY_BYTES = 64 * 1024;
export const MAX_QUEUED_BODY_BYTES = 4 * 1024;
export const MAX_ORDER_ID_LENGTH = 128;
export const MAX_TRACKER_LENGTH = 256;
export const MAX_EVENT_ID_LENGTH = 128;

export type SafepayEvent = {
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

export type WebhookAuthResult<T> = ({ ok: true } & T) | { ok: false; response: NextResponse };

const fail = (error: string, status: number): { ok: false; response: NextResponse } => ({
  ok: false,
  response: NextResponse.json({ error }, { status }),
});

/**
 * Authenticate a request from Safepay and return its raw body and parsed event.
 * Order matters: size bound, then signature over the raw bytes, and only then parsing.
 */
export async function authenticateSafepayWebhook(
  req: NextRequest,
): Promise<WebhookAuthResult<{ rawBody: string; event: SafepayEvent }>> {
  // Read the request itself, not a clone: when a body is over the limit the reader is
  // cancelled, and cancelling one branch of a cloned (tee'd) stream never completes
  // while the other branch stays unread, which would hang the request.
  const boundedBody = await readBoundedText(req, MAX_WEBHOOK_BODY_BYTES);
  if (!boundedBody.ok) return fail(boundedBody.error, boundedBody.status);

  const rawBody = boundedBody.text;
  const signature = req.headers.get("x-sfpy-signature") ?? "";
  if (!(await verifyWebhookSignature(rawBody, signature))) {
    return fail("Invalid signature.", 401);
  }

  let event: SafepayEvent;
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return fail("Invalid webhook event.", 400);
    }
    event = parsed as SafepayEvent;
  } catch {
    return fail("Invalid webhook event.", 400);
  }

  if (!safeSecretEqual(event.merchant_api_key, process.env.SAFEPAY_API_KEY)) {
    return fail("Merchant key mismatch.", 401);
  }

  const orderId = event.data?.metadata?.order_id;
  const tracker = event.data?.tracker;
  if (
    (typeof orderId === "string" && orderId.length > MAX_ORDER_ID_LENGTH) ||
    (typeof tracker === "string" && tracker.length > MAX_TRACKER_LENGTH)
  ) {
    return fail("Invalid webhook event.", 400);
  }

  return { ok: true, rawBody, event };
}

/** Authenticate a QStash delivery and return the stored event ID it refers to. */
export async function authenticateQueuedSafepayRequest(
  req: NextRequest,
): Promise<WebhookAuthResult<{ eventId: string }>> {
  const boundedBody = req.body
    ? await readBoundedText(req, MAX_QUEUED_BODY_BYTES)
    : { ok: true as const, text: "" };
  if (!boundedBody.ok) return fail(boundedBody.error, boundedBody.status);

  try {
    await verifyUpstashRequest(req, { acceptBearerToken: false, body: boundedBody.text });
  } catch {
    return fail("Unauthorized", 401);
  }

  try {
    const parsed: unknown = JSON.parse(boundedBody.text);
    const eventId = (parsed as { eventId?: unknown } | null)?.eventId;
    if (
      !parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
      typeof eventId !== "string" || eventId.length === 0 || eventId.length > MAX_EVENT_ID_LENGTH
    ) {
      return fail("Invalid queued event.", 400);
    }
    return { ok: true, eventId };
  } catch {
    return fail("Invalid queued event.", 400);
  }
}
