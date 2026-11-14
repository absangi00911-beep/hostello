// Path: src/lib/csp.ts
//
// Content-Security-Policy construction, shared by next.config.ts (the enforced policy)
// and src/proxy.ts (the per-request nonce policy, report-only for now). This file must
// not import anything: next.config.ts loads it before the app's path aliases exist.

/** img-src source for the project's image bucket: its exact origin, else the r2.dev wildcard. */
export function getR2CspSource(publicUrl: string | undefined): string {
  try {
    const url = new URL(publicUrl ?? "");
    if (url.protocol === "https:") return `https://${url.host}`;
  } catch {
    // fall through to the development/preview wildcard
  }
  return "https://*.r2.dev";
}

export interface ContentSecurityPolicyInput {
  /** script-src sources, e.g. ["'self'", "'unsafe-inline'"] or a nonce list. */
  scriptSrc: readonly string[];
  r2Source: string;
  /** Where browsers POST violation reports (adds the report-uri directive). */
  reportUri?: string;
}

export function buildContentSecurityPolicy({
  scriptSrc,
  r2Source,
  reportUri,
}: ContentSecurityPolicyInput): string {
  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' blob: data: https://images.unsplash.com ${r2Source} https://*.cloudflare.com https://*.tile.openstreetmap.org`,
    // API connections: includes Safepay, JazzCash, and EasyPaisa
    [
      "connect-src 'self'",
      "https://*.neon.tech",
      "https://*.upstash.io",
      "https://api.resend.com",
      "https://*.getsafepay.com",
      "https://sandbox.api.getsafepay.com",
      "https://sandbox.jazzcash.com.pk",
      "https://payments.jazzcash.com.pk",
      "https://easypaisasandbox.pk",
      "https://easypaisa.com.pk",
      "https://*.sentry.io",
    ].join(" "),
    // Allow POSTing to payment gateway checkout pages from this origin
    [
      "form-action 'self'",
      "https://sandbox.jazzcash.com.pk",
      "https://payments.jazzcash.com.pk",
      "https://easypaisasandbox.pk",
      "https://easypaisa.com.pk",
      "https://sandbox.getsafepay.com",
      "https://getsafepay.com",
    ].join(" "),
    // Allow OpenStreetMap embeds for the hostel location map
    "frame-src https://www.openstreetmap.org",
    "object-src 'none'",
    "base-uri 'self'",
    "upgrade-insecure-requests",
    ...(reportUri ? [`report-uri ${reportUri}`] : []),
  ].join("; ");
}

/** Today's enforced script sources. 'unsafe-inline' goes away once the nonce policy is enforced. */
export function getEnforcedScriptSrc(isDevelopment: boolean): string[] {
  return ["'self'", "'unsafe-inline'", ...(isDevelopment ? ["'unsafe-eval'"] : [])];
}

/** Nonce-based script sources: only scripts carrying this request's nonce (and what they load). */
export function getNonceScriptSrc(nonce: string, isDevelopment: boolean): string[] {
  return ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(isDevelopment ? ["'unsafe-eval'"] : [])];
}

/** A fresh, unguessable, base64 nonce for one response. */
export function generateNonce(): string {
  return btoa(crypto.randomUUID());
}
