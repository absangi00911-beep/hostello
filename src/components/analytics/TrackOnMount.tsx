"use client";

import { useEffect } from "react";
import { trackOnce } from "@/lib/analytics/client";
import type { ClientEventName, ClientEventProperties } from "@/lib/analytics/events";

/**
 * Records a funnel event once per tab session when the page that renders it is opened.
 * Renders nothing, so server components can place it without becoming client components.
 */
export function TrackOnMount<Name extends ClientEventName>({
  event,
  dedupeKey,
  properties,
}: {
  event: Name;
  /** The same event with the same key is recorded once per tab session. */
  dedupeKey: string;
  properties: ClientEventProperties[Name];
}) {
  // The properties object is new on every render; the dedupe key is what identifies the event.
  useEffect(() => {
    trackOnce(event, dedupeKey, properties);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, dedupeKey]);

  return null;
}
