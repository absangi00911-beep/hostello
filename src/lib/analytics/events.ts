// Path: src/lib/analytics/events.ts
//
// The funnel events and exactly what each may carry. Events are anonymous: no user id, no IP
// address, no free text from the visitor other than a short city name. Anything not listed
// here is rejected, so a new property is a decision made in this file.
import { z } from "zod";

/** An id as the app issues them (cuid) or any similar opaque token. */
const entityId = z.string().min(8).max(64).regex(/^[A-Za-z0-9_-]+$/);

/** Sent by the browser, validated by POST /api/events. */
export const CLIENT_EVENT_SCHEMAS = {
  /** A results page was shown for a search. `city` is the city the visitor chose, if any. */
  search_performed: z
    .object({
      city: z.string().trim().max(60).optional(),
      nearby: z.boolean(),
      hasDates: z.boolean(),
      resultCount: z.number().int().min(0).max(100_000),
    })
    .strict(),
  /** A hostel page was opened. */
  hostel_viewed: z.object({ hostelId: entityId }).strict(),
  /** The visitor chose a room and dates and moved on to review the booking. */
  booking_started: z.object({ hostelId: entityId, roomId: entityId.optional() }).strict(),
} as const;

export type ClientEventName = keyof typeof CLIENT_EVENT_SCHEMAS;
export type ClientEventProperties = { [Name in ClientEventName]: z.infer<(typeof CLIENT_EVENT_SCHEMAS)[Name]> };

/** Recorded by the server at the moment they happen, so they cannot be forged or blocked. */
export const SERVER_EVENT_NAMES = ["booking_requested", "payment_started", "payment_confirmed"] as const;
export type ServerEventName = (typeof SERVER_EVENT_NAMES)[number];

/** The funnel, in order. The first three steps are counted per browser session, the rest per booking. */
export const FUNNEL_STEPS = [
  "search_performed",
  "hostel_viewed",
  "booking_started",
  "booking_requested",
  "payment_started",
  "payment_confirmed",
] as const;
export type FunnelStep = (typeof FUNNEL_STEPS)[number];

export const SESSION_ID_PATTERN = /^[A-Za-z0-9-]{16,64}$/;

export function isClientEventName(name: unknown): name is ClientEventName {
  return typeof name === "string" && Object.hasOwn(CLIENT_EVENT_SCHEMAS, name);
}
