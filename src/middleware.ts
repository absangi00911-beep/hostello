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
  "/api/auth/verify-email", // GET only, safe
  "/api/auth/mobile/login", // Mobile login — no Origin header
  "/api/cron/",             // Upstash QStash — Bearer token auth
  "/api/payment/webhook",   // Safepay — HMAC signature auth
];

const METHOD_BASED_CSRF_EXEMPT: { path: string; methods: string[] }[] = [
  { path: "/api/payment/callback", methods: ["POST"] },
];

export default function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);

  // ── Bearer Token Support (Mobile) ──────────────────────────────────────
  // Mobile clients send the JWT in the Authorization header. We detect it
  // and inject it into the cookies so NextAuth's auth() helper can find it.
  const authHeader = req.headers.get("authorization");
  const isBearer = authHeader?.startsWith("Bearer ");
  
  if (isBearer && authHeader) {
    const token = authHeader.split(" ")[1];
    // Set for both standard and secure cookie names to be safe.
    // NextAuth uses __Secure- prefix in production for HTTPS.
    req.cookies.set("authjs.session-token", token);
    req.cookies.set("__Secure-authjs.session-token", token);
  }

  // ── CSRF protection ────────────────────────────────────────────────────
  // Applied to every state-mutating API route that isn't exempt.
  // Bearer-authenticated requests (mobile) are exempt as they don't use
  // browser-style ambient authority (cookies) for the initial request detection.
  const isMethodBasedExempt = METHOD_BASED_CSRF_EXEMPT.some(
    (rule) => pathname.startsWith(rule.path) && rule.methods.includes(req.method)
  );

  if (
    pathname.startsWith("/api/") &&
    !CSRF_EXEMPT.some((p) => pathname.startsWith(p)) &&
    !isMethodBasedExempt &&
    !isBearer
  ) {
    const csrfError = verifyCsrfOrigin(req);
    if (csrfError) return csrfError;
  }

  // Ensure headers (including injected cookies) are passed to the next handler
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
  runtime: "experimental-edge",
};