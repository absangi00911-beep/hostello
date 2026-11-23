import { NextResponse } from "next/server";
import { z } from "zod";
import { CLIENT_EVENT_SCHEMAS, SESSION_ID_PATTERN, isClientEventName } from "@/lib/analytics/events";
import { recordAnalyticsEvent } from "@/lib/analytics/sink";
import { getIp, rateLimit } from "@/lib/rate-limit";

// Receives funnel events from the browser (see lib/analytics/client.ts). It answers 204 for
// everything it deliberately ignores, so a visitor's browser never sees a failure, and 400
// only for a malformed event from our own code.
const MAX_BODY_BYTES = 2 * 1024;
const MAX_EVENTS_PER_MINUTE = 120;
const IGNORED_USER_AGENTS = /bot|crawl|spider|slurp|preview|monitor/i;

const envelope = z.object({
  name: z.string().max(40),
  sessionId: z.string().regex(SESSION_ID_PATTERN),
  properties: z.record(z.string(), z.unknown()),
});

const noContent = () => new Response(null, { status: 204 });

export async function POST(req: Request) {
  // The visitor opted out (the browser also checks this; the headers cover any other client).
  if (req.headers.get("sec-gpc") === "1" || req.headers.get("dnt") === "1") return noContent();
  if (IGNORED_USER_AGENTS.test(req.headers.get("user-agent") ?? "")) return noContent();
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Event too large." }, { status: 413 });
  }

  // Fail-open on purpose: losing a few events during a Redis outage beats a new dependency.
  const limit = await rateLimit(`events:${getIp(req)}`, { limit: MAX_EVENTS_PER_MINUTE, windowMs: 60_000 });
  if (!limit.ok) return noContent();

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return NextResponse.json({ error: "Event too large." }, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }

  const parsedEnvelope = envelope.safeParse(body);
  if (!parsedEnvelope.success || !isClientEventName(parsedEnvelope.data.name)) {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }
  const { name, sessionId } = parsedEnvelope.data;

  const properties = CLIENT_EVENT_SCHEMAS[name].safeParse(parsedEnvelope.data.properties);
  if (!properties.success) return NextResponse.json({ error: "Invalid event." }, { status: 400 });

  const { hostelId, ...rest } = properties.data as { hostelId?: string } & Record<string, unknown>;
  await recordAnalyticsEvent({
    name,
    sessionId,
    hostelId: hostelId ?? null,
    bookingId: null,
    properties: Object.keys(rest).length > 0 ? rest : null,
  });

  return noContent();
}
