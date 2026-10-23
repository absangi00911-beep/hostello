// Path: src/proxy.ts

import { NextResponse, type NextRequest } from "next/server";
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
];

const METHOD_BASED_CSRF_EXEMPT: { path: string; methods: string[] }[] = [
  { path: "/api/payment/callback", methods: ["POST"] },
];

export function proxy(req: NextRequest) {
  const { pathname } = new URL(req.url);

  // -- Bearer Token Support (Mobile) --
  // Mobile clients send the JWT in the Authorization header. We detect it
  // and inject it into the cookies so NextAuth's auth() helper can find it.
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

  return NextResponse.next({
    request: {
      headers: new Headers(req.headers),
    },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
