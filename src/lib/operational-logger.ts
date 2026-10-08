import { createHmac, randomUUID } from "node:crypto";

export type OperationalLogLevel = "info" | "warn" | "error";

export interface OperationalLogContext {
  request_id: string;
  trace_id?: string;
}

type OperationalLogAttributes = Record<string, string | number | boolean | null>;

const SAFE_PLATFORM_REQUEST_ID = /^[A-Za-z0-9:_-]{1,128}$/;
const TRACEPARENT_PATTERN = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})(?:-([0-9a-f-]+))?$/;

/** Return a keyed, deterministic identifier for audit correlation without logging the source ID. */
export function hashOperationalIdentifier(value: string): string | null {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret || !value) return null;
  return createHmac("sha256", secret).update(value).digest("hex").slice(0, 24);
}

/**
 * Make a log correlation context for a request. Trace IDs are accepted only
 * from a syntactically valid W3C traceparent header. The platform request ID
 * is a correlation hint only and must never be used for authorization.
 */
export function createOperationalLogContext(request?: Request): OperationalLogContext {
  const vercelRequestId = request?.headers.get("x-vercel-id")?.trim();
  const requestId = vercelRequestId && SAFE_PLATFORM_REQUEST_ID.test(vercelRequestId)
    ? vercelRequestId
    : randomUUID();
  const traceId = parseTraceId(request?.headers.get("traceparent"));

  return {
    request_id: requestId,
    ...(traceId ? { trace_id: traceId } : {}),
  };
}

function parseTraceId(traceparent: string | null | undefined): string | null {
  if (!traceparent) return null;

  const match = TRACEPARENT_PATTERN.exec(traceparent.trim());
  if (!match) return null;

  const [, version, traceId, parentId] = match;
  if (version === "ff" || traceId === "0".repeat(32) || parentId === "0".repeat(16)) return null;
  if (version === "00" && match[5] !== undefined) return null;

  return traceId;
}

/** Emit a compact JSON event with stable field names and no implicit request data. */
export function logOperationalEvent(
  level: OperationalLogLevel,
  event: string,
  attributes: OperationalLogAttributes = {},
  context: OperationalLogContext = createOperationalLogContext(),
): void {
  const record = JSON.stringify({
    timestamp: new Date().toISOString(),
    severity: level.toUpperCase(),
    event,
    service_name: "hostello",
    ...context,
    attributes,
  });

  if (level === "error") console.error(record);
  else if (level === "warn") console.warn(record);
  // eslint-disable-next-line no-console -- Vercel/Axiom ingest JSON info-level events from stdout.
  else console.info(record);
}
