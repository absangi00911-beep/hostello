const DEFAULT_APP_URL = "https://hostello.pk";

function normalizeUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function isAbsoluteHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getAppUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.AUTH_URL,
  ];

  for (const candidate of candidates) {
    if (candidate && isAbsoluteHttpUrl(candidate)) {
      return normalizeUrl(candidate);
    }
  }

  // Fallback behaviour for development only
  if (process.env.NODE_ENV !== 'production') {
    console.warn("WARN: APP_URL not set, defaulting to local http://localhost:3000");
    return "http://localhost:3000";
  }

  // Production MUST have it set
  throw new Error("CRITICAL: APP_URL environment variable is not configured for production.");
}

export function getRequestOrigin(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  if (forwardedProto && forwardedHost) {
    return normalizeUrl(`${forwardedProto}://${forwardedHost}`);
  }

  return normalizeUrl(new URL(request.url).origin);
}
