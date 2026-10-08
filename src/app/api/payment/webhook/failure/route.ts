import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readBoundedText } from "@/lib/bounded-json";
import { createOperationalLogContext, logOperationalEvent } from "@/lib/operational-logger";
import { verifyUpstashRequest } from "@/lib/verify-upstash";

const MAX_CALLBACK_BYTES = 8 * 1024;
const MAX_SOURCE_BODY_CHARS = 4 * 1024;

type QStashFailureCallback = {
  sourceBody?: unknown;
  retried?: unknown;
  maxRetries?: unknown;
};

export async function POST(req: NextRequest) {
  try {
    await verifyUpstashRequest(req, { acceptBearerToken: false });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const boundedBody = await readBoundedText(req, MAX_CALLBACK_BYTES);
  if (!boundedBody.ok) {
    return NextResponse.json({ error: boundedBody.error }, { status: boundedBody.status });
  }

  let callback: QStashFailureCallback;
  try {
    const parsed: unknown = JSON.parse(boundedBody.text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Invalid failure callback." }, { status: 400 });
    }
    callback = parsed as QStashFailureCallback;
  } catch {
    return NextResponse.json({ error: "Invalid failure callback." }, { status: 400 });
  }

  if (
    typeof callback.sourceBody !== "string" ||
    callback.sourceBody.length === 0 ||
    callback.sourceBody.length > MAX_SOURCE_BODY_CHARS ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(callback.sourceBody) ||
    !Number.isSafeInteger(callback.retried) ||
    !Number.isSafeInteger(callback.maxRetries) ||
    (callback.retried as number) < (callback.maxRetries as number)
  ) {
    return NextResponse.json({ error: "Invalid failure callback." }, { status: 400 });
  }

  let eventId: unknown;
  try {
    const sourceBody = Buffer.from(callback.sourceBody, "base64").toString("utf8");
    const parsed: unknown = JSON.parse(sourceBody);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Invalid failed event." }, { status: 400 });
    }
    eventId = (parsed as { eventId?: unknown }).eventId;
  } catch {
    return NextResponse.json({ error: "Invalid failed event." }, { status: 400 });
  }

  if (typeof eventId !== "string" || eventId.length === 0 || eventId.length > 128) {
    return NextResponse.json({ error: "Invalid failed event." }, { status: 400 });
  }

  await db.safepayWebhookEvent.updateMany({
    where: { id: eventId, status: { in: ["QUEUED", "PROCESSING"] } },
    data: {
      status: "RETRYABLE",
      processingStartedAt: null,
      lastErrorCode: "qstash_delivery_exhausted",
    },
  });
  logOperationalEvent("error", "payment.webhook.queue_exhausted", {
    delivery_attempts: callback.retried as number,
  }, createOperationalLogContext(req));

  return NextResponse.json({ received: true });
}
