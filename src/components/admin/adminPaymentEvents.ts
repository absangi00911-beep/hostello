export type PaymentEventStatus = "RETRYABLE" | "RECONCILIATION_REQUIRED";

export interface PaymentEventReplay {
  adminUserId: string;
  providerTracker: string;
  reason: string;
  createdAt: string;
}

export interface AdminPaymentEvent {
  id: string;
  eventType: string;
  merchantOrderId: string | null;
  tracker: string | null;
  providerState: string | null;
  /** Safepay amount in minor units (paisa). */
  amountMinorUnits: number | null;
  currency: string | null;
  status: PaymentEventStatus;
  processingAttempts: number;
  lastErrorCode: string | null;
  receivedAt: string;
  updatedAt: string;
  replays: PaymentEventReplay[];
}

export interface AdminPaymentEventsPage {
  data: AdminPaymentEvent[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const RETRY_REASON_MIN = 20;
export const RETRY_REASON_MAX = 500;
export const TRACKER_MAX = 256;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function nullableString(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : undefined;
}

function isDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function parseReplay(value: unknown): PaymentEventReplay | null {
  if (
    !isRecord(value) ||
    typeof value.adminUserId !== "string" ||
    typeof value.providerTracker !== "string" ||
    typeof value.reason !== "string" ||
    !isDateString(value.createdAt)
  ) {
    return null;
  }
  return {
    adminUserId: value.adminUserId,
    providerTracker: value.providerTracker,
    reason: value.reason,
    createdAt: value.createdAt,
  };
}

function parseEvent(value: unknown): AdminPaymentEvent | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.eventType !== "string" ||
    (value.status !== "RETRYABLE" &&
      value.status !== "RECONCILIATION_REQUIRED") ||
    typeof value.processingAttempts !== "number" ||
    !isDateString(value.receivedAt) ||
    !isDateString(value.updatedAt)
  ) {
    return null;
  }
  const merchantOrderId = nullableString(value.merchantOrderId);
  const tracker = nullableString(value.tracker);
  const providerState = nullableString(value.providerState);
  const currency = nullableString(value.currency);
  const lastErrorCode = nullableString(value.lastErrorCode);
  if (
    merchantOrderId === undefined ||
    tracker === undefined ||
    providerState === undefined ||
    currency === undefined ||
    lastErrorCode === undefined
  ) {
    return null;
  }
  const amount =
    value.amountMinorUnits === null || value.amountMinorUnits === undefined
      ? null
      : typeof value.amountMinorUnits === "number"
        ? value.amountMinorUnits
        : undefined;
  if (amount === undefined) return null;
  const rawReplays = Array.isArray(value.replayEvents) ? value.replayEvents : [];
  const replays = rawReplays.map(parseReplay);
  if (replays.some((replay) => replay === null)) return null;
  return {
    id: value.id,
    eventType: value.eventType,
    merchantOrderId,
    tracker,
    providerState,
    amountMinorUnits: amount,
    currency,
    status: value.status,
    processingAttempts: value.processingAttempts,
    lastErrorCode,
    receivedAt: value.receivedAt,
    updatedAt: value.updatedAt,
    replays: replays as PaymentEventReplay[],
  };
}

/** Parses `GET /api/admin/payment-events`. Null when the shape is unexpected. */
export function parseAdminPaymentEventsPage(
  value: unknown,
): AdminPaymentEventsPage | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.data) ||
    typeof value.total !== "number" ||
    typeof value.page !== "number" ||
    typeof value.limit !== "number"
  ) {
    return null;
  }
  const data = value.data.map(parseEvent);
  if (data.some((event) => event === null)) return null;
  const events = data as AdminPaymentEvent[];
  return {
    data: events,
    total: value.total,
    page: value.page,
    limit: value.limit,
    // The API sends no hasMore; derive it the way it paginates.
    hasMore: (value.page - 1) * value.limit + events.length < value.total,
  };
}

export function eventTypeLabel(eventType: string): string {
  if (eventType === "payment.succeeded") return "Payment succeeded";
  if (eventType === "payment.failed") return "Payment failed";
  return eventType;
}

export function statusLabel(status: PaymentEventStatus): string {
  return status === "RETRYABLE" ? "Can be retried" : "Needs reconciliation";
}

/** Plain-language text for the error codes the code base writes. */
export function errorCodeLabel(code: string): string {
  switch (code) {
    case "qstash_delivery_exhausted":
      return "Delivery to the processing queue failed after all attempts.";
    case "admin_retry_enqueue_failed":
      return "The last admin retry could not be queued.";
    case "invalid_stored_event":
      return "The stored event evidence is invalid.";
    default:
      return "Processing stopped with an error.";
  }
}

/** Mirrors the API: events with invalid stored evidence cannot be replayed. */
export function retryBlockedReason(event: AdminPaymentEvent): string | null {
  if (event.status === "RECONCILIATION_REQUIRED") {
    return "This event needs manual reconciliation in Safepay and cannot be replayed from here.";
  }
  if (!event.tracker) {
    return "This event has no Safepay tracker, so it cannot be retried.";
  }
  if (event.lastErrorCode === "invalid_stored_event") {
    return "The stored event evidence is invalid, so it cannot be retried.";
  }
  return null;
}

export function formatEventAmount(
  amountMinorUnits: number | null,
  currency: string | null,
): string | null {
  if (amountMinorUnits === null) return null;
  const code = currency && /^[A-Za-z]{3}$/.test(currency) ? currency : "PKR";
  try {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: code.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amountMinorUnits / 100);
  } catch {
    return null;
  }
}

export function validateTracker(
  entered: string,
  stored: string | null,
): string | null {
  const value = entered.trim();
  if (!value) return "Enter the tracker you checked in Safepay.";
  if (value.length > TRACKER_MAX) {
    return `The tracker can be at most ${TRACKER_MAX} characters.`;
  }
  if (value !== stored) {
    return "This must exactly match the tracker shown on this event.";
  }
  return null;
}

export function validateRetryReason(reason: string): string | null {
  const length = reason.trim().length;
  if (length < RETRY_REASON_MIN) {
    return `Explain why in at least ${RETRY_REASON_MIN} characters.`;
  }
  if (length > RETRY_REASON_MAX) {
    return `The reason can be at most ${RETRY_REASON_MAX} characters.`;
  }
  return null;
}
