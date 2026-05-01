import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import { verifyCsrfOrigin } from "@/lib/csrf";

// API route prefixes that are exempt from the CSRF origin check because they
// use their own authentication mechanism (Bearer tokens, HMAC signatures).
const CSRF_EXEMPT: string[] = [
  "/api/auth/",           // NextAuth routes
  "/api/cron/",           // Upstash QStash — Bearer token auth
  "/api/payment/webhook", // Safepay — HMAC signature auth
];

// Routes where CSRF exemption depends on the HTTP method.
// These routes use their own authentication (e.g., HMAC signatures) but still
// need protection from CSRF attacks. The verifyCsrfOrigin function already
// allows safe methods (GET/HEAD/OPTIONS) without CSRF checks; we only exempt
// POST requests where the request originates from a payment gateway server.
const METHOD_BASED_CSRF_EXEMPT: { path: string; methods: string[] }[] = [
  { path: "/api/payment/callback", methods: ["POST"] },
];

const PROTECTED  = ["/dashboard", "/profile", "/bookings", "/favorites", "/messages"];
const ADMIN_ONLY = ["/admin"];
const AUTH_ONLY  = ["/login", "/signup"];

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  // ── Redirect old city URLs ─────────────────────────────────────────────
  // Redirect /hostels/[city] to /cities/[city] for backward compatibility
  const hostelsMatch = pathname.match(/^\/hostels\/([a-z]+)$/);
  if (hostelsMatch) {
    const city = hostelsMatch[1];
    const url = req.nextUrl.clone();
    url.pathname = `/cities/${city}`;
    return NextResponse.redirect(url, { status: 301 });
  }

  // ── CSRF protection ────────────────────────────────────────────────────
  // Applied to every state-mutating API route that isn't exempt.
  // For most exempt routes, all methods are skipped. For /api/payment/callback,
  // only POST is exempted — GET requests still pass through verifyCsrfOrigin,
  // which allows safe methods automatically.
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

  // ── Route-level auth guards ────────────────────────────────────────────
  if (PROTECTED.some((p) => pathname.startsWith(p)) && !isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (ADMIN_ONLY.some((p) => pathname.startsWith(p))) {
    if (!isLoggedIn || role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }

  if (AUTH_ONLY.some((p) => pathname.startsWith(p)) && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};