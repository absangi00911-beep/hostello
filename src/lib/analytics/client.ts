// Path: src/lib/analytics/client.ts
//
// Browser side: track() sends one funnel event to POST /api/events and is safe to call from
// anywhere. It never throws, never blocks, and sends nothing for visitors who have asked not
// to be tracked. The only identifier is a random id kept in this tab's sessionStorage: no
// cookie, nothing that survives closing the tab, nothing that links two visits.
import type { ClientEventName, ClientEventProperties } from "./events";

const SESSION_KEY = "hostello.analytics.session";
const ENDPOINT = "/api/events";

let memorySessionId: string | null = null;
const alreadySent = new Set<string>();

/** Do Not Track or Global Privacy Control: the visitor said no, so nothing is sent. */
export function trackingIsDisallowed(): boolean {
  if (typeof navigator === "undefined") return true;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  return nav.globalPrivacyControl === true || nav.doNotTrack === "1" || nav.doNotTrack === "yes" || nav.msDoNotTrack === "1";
}

export function getAnalyticsSessionId(): string {
  try {
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    if (stored) return stored;
    const created = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    // Storage blocked: an id that lasts until the page is closed is all we can keep.
    memorySessionId ??= crypto.randomUUID();
    return memorySessionId;
  }
}

export function track<Name extends ClientEventName>(name: Name, properties: ClientEventProperties[Name]): void {
  if (typeof window === "undefined" || trackingIsDisallowed()) return;

  try {
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, sessionId: getAnalyticsSessionId(), properties }),
      // Lets the request finish if the visitor navigates away straight afterwards.
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Analytics must never surface an error to the visitor.
  }
}

/** Like track(), but only the first call per tab session for this event and key. */
export function trackOnce<Name extends ClientEventName>(
  name: Name,
  key: string,
  properties: ClientEventProperties[Name],
): void {
  // Check first, so a call that sends nothing does not use up this event's one chance.
  if (typeof window === "undefined" || trackingIsDisallowed()) return;
  const id = `${name}:${key}`;
  if (alreadySent.has(id)) return;
  alreadySent.add(id);
  track(name, properties);
}

/** For tests: forget what has been sent and the in-memory session. */
export function resetAnalyticsClientForTests(): void {
  alreadySent.clear();
  memorySessionId = null;
}
