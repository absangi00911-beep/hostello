/**
 * Return low-risk diagnostics for logs without serializing provider errors.
 * HTTP client errors can contain request headers, URLs, and response bodies.
 */
export interface SafeErrorSummary {
  name: string;
  code?: string;
  status?: number;
}

const SAFE_ERROR_CODES = new Set([
  "ECONNABORTED",
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "EAI_AGAIN",
  "ENETUNREACH",
  "ENOTFOUND",
  "EPIPE",
  "ETIMEDOUT",
  "EPERM",
  "ERR_BAD_REQUEST",
  "ERR_BAD_RESPONSE",
  "ERR_CANCELED",
  "ERR_NETWORK",
]);

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function safeErrorName(value: unknown): string {
  return typeof value === "string" && /^[A-Za-z][A-Za-z0-9]{0,63}$/.test(value)
    ? value
    : "Error";
}

function safeErrorCode(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  return SAFE_ERROR_CODES.has(value) || /^P\d{4}$/.test(value) || /^\d{3,6}$/.test(value)
    ? value
    : undefined;
}

function safeHttpStatus(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 100 && value <= 599
    ? value
    : undefined;
}

export function getSafeErrorSummary(error: unknown): SafeErrorSummary {
  const details = asRecord(error);
  if (!details) return { name: "UnknownError" };

  const response = asRecord(details.response);
  const name = safeErrorName(details.name);
  const code = safeErrorCode(details.code);
  const status =
    safeHttpStatus(details.httpStatus) ??
    safeHttpStatus(details.statusCode) ??
    safeHttpStatus(details.status) ??
    safeHttpStatus(response?.status);

  return {
    name,
    ...(code ? { code } : {}),
    ...(status ? { status } : {}),
  };
}
