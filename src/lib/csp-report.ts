// Path: src/lib/csp-report.ts

export interface CspViolationSummary {
  directive: string;
  blocked: string;
  document: string;
  disposition: string;
}

const MAX_FIELD_LENGTH = 120;

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.slice(0, MAX_FIELD_LENGTH) : "";
}

/**
 * Reduce a reported URL to its origin. Paths, query strings and fragments can carry
 * tokens or personal data; keywords such as "inline" or "eval" pass through unchanged.
 */
export function summarizeBlockedUri(value: unknown): string {
  const raw = text(value);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : url.protocol.replace(":", "");
  } catch {
    return raw.replace(/[^a-z-]/gi, "").slice(0, 40);
  }
}

/** The document's path only: no origin, query string or fragment. */
export function summarizeDocument(value: unknown): string {
  const raw = text(value);
  if (!raw) return "";
  try {
    return new URL(raw).pathname;
  } catch {
    return "";
  }
}

function summarizeOne(report: Record<string, unknown>): CspViolationSummary | null {
  const directive = text(report["effectiveDirective"] ?? report["effective-directive"] ?? report["violated-directive"]);
  if (!directive) return null;
  return {
    directive,
    blocked: summarizeBlockedUri(report["blockedURL"] ?? report["blockedURI"] ?? report["blocked-uri"]),
    document: summarizeDocument(report["documentURL"] ?? report["documentURI"] ?? report["document-uri"]),
    disposition: text(report["disposition"]) || "report",
  };
}

/**
 * Accepts both report formats browsers send: the legacy `report-uri` body
 * (`{"csp-report": {...}}`) and the Reporting API (`[{"type": "csp-violation", "body": {...}}]`).
 * Returns sanitized summaries, at most `limit`.
 */
export function parseCspReports(payload: unknown, limit = 5): CspViolationSummary[] {
  const items = Array.isArray(payload) ? payload : [payload];
  const summaries: CspViolationSummary[] = [];

  for (const item of items) {
    const record = asRecord(item);
    if (!record) continue;
    const body =
      asRecord(record["csp-report"]) ??
      (record["type"] === "csp-violation" ? asRecord(record["body"]) : null);
    const summary = body ? summarizeOne(body) : null;
    if (summary) summaries.push(summary);
    if (summaries.length >= limit) break;
  }
  return summaries;
}
