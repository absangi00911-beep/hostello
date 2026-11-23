// Path: src/lib/analytics/sink.ts
//
// Where recorded events go. The app talks only to recordAnalyticsEvent(); the database is
// one implementation of AnalyticsSink. To send events to a hosted analytics product instead
// (or as well), write another sink and select it in setAnalyticsSink: no caller changes.
import { db } from "@/lib/db";
import { logOperationalEvent } from "@/lib/operational-logger";
import { getSafeErrorSummary } from "@/lib/safe-error";
import type { ServerEventName } from "./events";

export interface AnalyticsRecord {
  name: string;
  sessionId: string | null;
  hostelId: string | null;
  bookingId: string | null;
  properties: Record<string, unknown> | null;
}

export interface AnalyticsSink {
  record(event: AnalyticsRecord): Promise<void>;
}

export const databaseSink: AnalyticsSink = {
  async record(event) {
    await db.analyticsEvent.create({
      data: {
        name: event.name,
        sessionId: event.sessionId,
        hostelId: event.hostelId,
        bookingId: event.bookingId,
        // Prisma's JSON input has no null literal: omit the column instead.
        ...(event.properties ? { properties: event.properties as never } : {}),
      },
    });
  },
};

let activeSink: AnalyticsSink = databaseSink;

/** Swap the destination (tests, or a different provider). Returns the previous sink. */
export function setAnalyticsSink(sink: AnalyticsSink): AnalyticsSink {
  const previous = activeSink;
  activeSink = sink;
  return previous;
}

/**
 * Record one event. Never throws and never makes the caller wait on a failure: analytics
 * must not be able to break a booking, a payment or a webhook.
 */
export async function recordAnalyticsEvent(event: AnalyticsRecord): Promise<void> {
  try {
    await activeSink.record(event);
  } catch (error) {
    const summary = getSafeErrorSummary(error);
    logOperationalEvent("warn", "analytics.record_failed", {
      event_name: event.name,
      error_name: summary.name,
      error_code: summary.code ?? null,
    });
  }
}

/** An event the server itself observed, tied to the booking it belongs to. */
export function recordServerEvent(
  name: ServerEventName,
  ids: { bookingId: string; hostelId?: string | null },
): Promise<void> {
  return recordAnalyticsEvent({
    name,
    sessionId: null,
    hostelId: ids.hostelId ?? null,
    bookingId: ids.bookingId,
    properties: null,
  });
}
