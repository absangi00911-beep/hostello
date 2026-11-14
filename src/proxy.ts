// Path: src/proxy.ts

import { NextResponse, type NextRequest } from "next/server";
import {
  buildContentSecurityPolicy,
  generateNonce,
  getNonceScriptSrc,
  getR2CspSource,
  isCspEnforced,
} from "@/lib/csp";
import { verifyCsrfOrigin } from "@/lib/csrf";
import { validateEnvironmentOnce } from "@/lib/env-validation";

// Validate critical environment variables at startup (module level, once only)
validateEnvironmentOnce();

// API route prefixes that are exempt from the CSRF origin check because they
// use their own authentication mechanism (Bearer tokens, HMAC signatures) or are safe.
const CSRF_EXEMPT: string[] = [
  "/api/auth/callback",     // NextAuth OAuth callbacks
  "/api/auth/signin",       // NextAuth sign-in
  "/api/auth/signout",      // NextAuth sign-out
  "/api/auth/session",      // NextAuth session reads
  "/api/auth/csrf",         // NextAuth CSRF token
  "/api/auth/providers",    // NextAuth providers list
  "/api/cron/",             // Upstash QStash — Bearer token auth
  "/api/payment/webhook",   // Safepay — HMAC signature auth
  "/api/csp-report",        // Browser-sent CSP violation reports: no cookies/Origin, logs only
];

const METHOD_BASED_CSRF_EXEMPT: { path: string; methods: string[] }[] = [
  { path: "/api/payment/callback", methods: ["POST"] },
];

export function proxy(req: NextRequest) {
  const { pathname } = new URL(req.url);

  // -- CSRF protection --
  // Applied to every state-mutating API route that isn't exempt.
  const isMethodBasedExempt = METHOD_BASED_CSRF_EXEMPT.some(
    (rule) => pathname.startsWith(rule.path) && rule.methods.includes(req.method)
  );

  if (
    pathname.startsWith("/api/") &&
    !CSRF_EXEMPT.some((p) => pathname.startsWith(p)) &&
    !isMethodBasedExempt
  ) {
    const csrfError = verifyCsrfOrigin(req);
    if (csrfError) return csrfError;
  }

  // API routes return JSON, so they get no page policy.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next({ request: { headers: new Headers(req.headers) } });
  }

  // -- Nonce-based CSP --
  // A fresh nonce per request. Next.js reads it from the request's script-src and stamps
  // it on its own inline scripts. By default the policy is only reported (to
  // /api/csp-report) while next.config.ts still enforces its 'unsafe-inline' policy.
  // With CSP_ENFORCE=true it is enforced as well, and the browser applies both policies:
  // a script must satisfy each, so the nonce policy is the stricter one in effect.
  const headerName = isCspEnforced() ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only";
  const policy = buildContentSecurityPolicy({
    scriptSrc: getNonceScriptSrc(generateNonce(), process.env.NODE_ENV === "development"),
    r2Source: getR2CspSource(process.env.R2_PUBLIC_URL),
    reportUri: "/api/csp-report",
  });
  const requestHeaders = new Headers(req.headers);
  // A client must not choose the nonce its own response is rendered with.
  requestHeaders.delete("content-security-policy");
  requestHeaders.delete("content-security-policy-report-only");
  requestHeaders.set(headerName, policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(headerName, policy);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
