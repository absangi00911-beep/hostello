import { logOperationalEvent } from "@/lib/operational-logger";
import { parseCspReports } from "@/lib/csp-report";
import { getIp, rateLimit } from "@/lib/rate-limit";

// Receives Content-Security-Policy violation reports from browsers. No authentication or
// cookies are involved, so it only writes sanitized log lines (see csp-report.ts) and
// always answers 204: a report is never worth an error page or a retry.
const MAX_BODY_BYTES = 16 * 1024;
const NO_CONTENT = () => new Response(null, { status: 204 });

export async function POST(req: Request) {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return NO_CONTENT();

  // Fail-open on purpose: this endpoint is not a security boundary, and losing reports
  // during a Redis outage is better than turning the limiter into a dependency.
  const limit = await rateLimit(`csp-report:${getIp(req)}`, { limit: 20, windowMs: 60_000 });
  if (!limit.ok) return NO_CONTENT();

  try {
    const body = await req.text();
    if (body.length > MAX_BODY_BYTES) return NO_CONTENT();

    for (const violation of parseCspReports(JSON.parse(body))) {
      logOperationalEvent("warn", "csp.violation", { ...violation });
    }
  } catch {
    // Malformed report: ignore.
  }
  return NO_CONTENT();
}
