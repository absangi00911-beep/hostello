export type RefundState =
  | "NONE"
  | "PROCESSING"
  | "UNCERTAIN"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED";

export interface RefundBooking {
  id: string;
  hostelName: string;
  studentName: string;
  studentEmail: string;
  checkIn: string;
  checkOut: string;
  total: number;
  /** What the cancellation policy approved, capped at the total. */
  approvedAmount: number;
  refundedAmount: number;
  /** Approved minus already refunded; what the API would send next. */
  remainingAmount: number;
  refundState: RefundState;
}

export interface RefundBookingsPage {
  /** Cancelled bookings that need a refund action, in API order. */
  data: RefundBooking[];
  /** Cancelled bookings the API returned, before filtering. */
  scanned: number;
  total: number;
  page: number;
  hasMore: boolean;
}

const REFUND_STATES: readonly string[] = [
  "NONE",
  "PROCESSING",
  "UNCERTAIN",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

/** Mirrors `loadRefundableBooking` in `src/lib/refunds.ts`. */
export function remainingRefund(
  total: number,
  cancellationRefundAmount: number | null,
  refundedAmount: number,
): number {
  const approved = Math.min(total, cancellationRefundAmount ?? total);
  return Math.max(0, approved - refundedAmount);
}

/** True when the refund API would accept this booking, or it is mid-flight. */
export function needsRefundAction(booking: RefundBooking): boolean {
  if (booking.refundState === "REFUNDED") return false;
  return booking.remainingAmount > 0;
}

type Parsed = { booking: RefundBooking | null; actionable: boolean };

function parseBooking(value: unknown): Parsed | "invalid" {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.status !== "string" ||
    typeof value.paymentStatus !== "string" ||
    typeof value.total !== "number" ||
    !isValidDateString(value.checkIn) ||
    !isValidDateString(value.checkOut) ||
    !isRecord(value.hostel) ||
    typeof value.hostel.name !== "string" ||
    !isRecord(value.user) ||
    typeof value.user.name !== "string" ||
    typeof value.user.email !== "string"
  ) {
    return "invalid";
  }
  // Only paid (or partly refunded) cancellations can be refunded.
  if (
    value.status !== "CANCELLED" ||
    !["PAID", "PARTIALLY_REFUNDED"].includes(value.paymentStatus)
  ) {
    return { booking: null, actionable: false };
  }
  const refundedAmount =
    typeof value.refundedAmount === "number" ? value.refundedAmount : 0;
  const approvedSource =
    typeof value.cancellationRefundAmount === "number"
      ? value.cancellationRefundAmount
      : null;
  const refundState: RefundState =
    typeof value.refundState === "string" &&
    REFUND_STATES.includes(value.refundState)
      ? (value.refundState as RefundState)
      : "NONE";
  const remainingAmount = remainingRefund(
    value.total,
    approvedSource,
    refundedAmount,
  );
  const booking: RefundBooking = {
    id: value.id,
    hostelName: value.hostel.name,
    studentName: value.user.name,
    studentEmail: value.user.email,
    checkIn: value.checkIn,
    checkOut: value.checkOut,
    total: value.total,
    approvedAmount: Math.min(value.total, approvedSource ?? value.total),
    refundedAmount,
    remainingAmount,
    refundState,
  };
  return { booking, actionable: needsRefundAction(booking) };
}

/**
 * Parses `GET /api/bookings?status=CANCELLED` for an admin and keeps only the
 * bookings that need a refund action. Null when the shape is unexpected.
 */
export function parseRefundBookingsPage(
  value: unknown,
): RefundBookingsPage | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.data) ||
    typeof value.total !== "number" ||
    typeof value.page !== "number" ||
    typeof value.hasMore !== "boolean"
  ) {
    return null;
  }
  const parsed = value.data.map(parseBooking);
  if (parsed.some((entry) => entry === "invalid")) return null;
  const data = (parsed as Parsed[])
    .filter((entry) => entry.actionable && entry.booking)
    .map((entry) => entry.booking as RefundBooking);
  return {
    data,
    scanned: value.data.length,
    total: value.total,
    page: value.page,
    hasMore: value.hasMore,
  };
}

export function refundStateLabel(state: RefundState): string {
  switch (state) {
    case "PROCESSING":
      return "Refund in progress";
    case "UNCERTAIN":
      return "Outcome unconfirmed";
    case "PARTIALLY_REFUNDED":
      return "Partly refunded";
    case "REFUNDED":
      return "Refunded";
    default:
      return "Not refunded";
  }
}

/** States where an automatic request has no confirmed result yet. */
export function isUnresolved(state: RefundState): boolean {
  return state === "PROCESSING" || state === "UNCERTAIN";
}

/** Result text after `PATCH /api/admin/bookings/[id]/refund` succeeds. */
export function refundOutcome(
  studentName: string,
  result: { automatic: boolean; manualConfirmed: boolean },
): { tone: "success" | "error"; text: string } {
  if (result.manualConfirmed) {
    return {
      tone: "success",
      text: `Refund for ${studentName} recorded as confirmed.`,
    };
  }
  if (result.automatic) {
    return { tone: "success", text: `Refund sent to ${studentName}.` };
  }
  return {
    tone: "error",
    text: `The refund for ${studentName} was not confirmed by the payment provider. Check Safepay, then use "Confirm refund manually" only if the money was returned.`,
  };
}
