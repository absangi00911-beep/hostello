const SENSITIVE_KEY =
  /(?:password|passcode|otp|phone|email|token|secret|authorization|cookie|api[-_]?key|csrf|session|request[-_]?body)/i;

const SENSITIVE_TEXT_PATTERNS: Array<[RegExp, string]> = [
  [/(\b(?:password|passcode|otp|token|secret|authorization|api[-_]?key)\b\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;&]+)/gi, "$1[Filtered]"],
  [/(\bBearer\s+)[A-Za-z0-9._~+/-]+=*/gi, "$1[Filtered]"],
  [/(https?:\/\/[^\s?#]+)\?[^\s#]*/gi, "$1?[Filtered]"],
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[FilteredEmail]"],
  [/\b(?:\+?92|0)3\d{9}\b/g, "[FilteredPhone]"],
];

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function scrubText(value: string): string {
  return SENSITIVE_TEXT_PATTERNS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value,
  );
}

function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[Filtered]";
  if (typeof value === "string") return scrubText(value);
  if (Array.isArray(value)) return value.map((item) => scrubValue(item, depth + 1));

  const record = asRecord(value);
  if (!record) return value;

  return Object.fromEntries(
    Object.entries(record).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) ? "[Filtered]" : scrubValue(item, depth + 1),
    ]),
  );
}

/** Remove common personal and credential data before Sentry sends events. */
export function scrubSentryEvent(event: unknown): unknown {
  const record = asRecord(event);
  if (!record) return event;

  const request = asRecord(record.request);
  record.request = request?.method ? { method: request.method } : undefined;
  record.user = undefined;

  for (const key of ["message", "transaction"]) {
    if (typeof record[key] === "string") record[key] = scrubText(record[key] as string);
  }

  for (const key of ["extra", "contexts", "tags", "logentry", "breadcrumbs", "exception", "spans"]) {
    if (record[key] !== undefined) record[key] = scrubValue(record[key]);
  }

  return record;
}

/** Scrub span descriptions and attributes, which can carry URL or request data. */
export function scrubSentrySpan(span: unknown): unknown {
  const record = asRecord(span);
  if (!record) return span;

  if (typeof record.description === "string") {
    record.description = scrubText(record.description);
  }
  if (record.data !== undefined) record.data = scrubValue(record.data);
  if (record.links !== undefined) record.links = scrubValue(record.links);

  return record;
}
