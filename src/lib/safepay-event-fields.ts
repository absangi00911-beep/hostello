// Path: src/lib/safepay-event-fields.ts
//
// Field-level validation of an authenticated Safepay event. Pure functions: no I/O.
import { MAX_ORDER_ID_LENGTH, MAX_TRACKER_LENGTH, type SafepayEvent } from "@/lib/safepay-webhook-auth";

export function parseOrderId(event: SafepayEvent): string | null {
  const orderId = event.data?.metadata?.order_id;
  return typeof orderId === "string" && orderId.length > 0 && orderId.length <= MAX_ORDER_ID_LENGTH
    ? orderId
    : null;
}

export function parseTracker(event: SafepayEvent): string | null {
  const tracker = event.data?.tracker;
  return typeof tracker === "string" && tracker.length > 0 && tracker.length <= MAX_TRACKER_LENGTH
    ? tracker
    : null;
}

export function isSafepayBookingMethod(paymentMethod: string | null): boolean {
  // Older bookings may predate the payment-method field; checkout defaults
  // those to Safepay. Explicit assignments to another provider must not settle
  // through this webhook.
  return paymentMethod === null || paymentMethod === "safepay";
}

export function isValidPkrAmount(event: SafepayEvent, expected: number): boolean {
  return event.data?.currency === "PKR" &&
    typeof event.data.amount === "number" &&
    Number.isSafeInteger(event.data.amount) &&
    event.data.amount === expected;
}
