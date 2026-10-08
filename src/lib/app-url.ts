// Path: src/lib/app-url.ts

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

/**
 * Returns the trusted configured app origin for links and provider redirects.
 * Do not derive security-sensitive destinations from request Host headers.
 */
export function getAppOrigin() {
  const appUrl = new URL(getAppUrl());
  if (process.env.NODE_ENV === "production" && appUrl.protocol !== "https:") {
    throw new Error("CRITICAL: APP_URL must use HTTPS in production.");
  }
  return appUrl.origin;
}
