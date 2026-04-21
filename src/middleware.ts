import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";
import { verifyCsrfOrigin } from "@/lib/csrf";

// API route prefixes that are exempt from the CSRF origin check because they
// use their own authentication mechanism (Bearer tokens, HMAC signatures).
const CSRF_EXEMPT: string[] = [
  "/api/auth/",          // NextAuth routes
  "/api/cron/",          // Upstash QStash — Bearer token auth
  "/api/payment/webhook", // Safepay — HMAC signature auth
];

const PROTECTED  = ["/dashboard", "/profile", "/bookings", "/favorites", "/messages"];
const ADMIN_ONLY = ["/admin"];
const AUTH_ONLY  = ["/login", "/signup"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  // ── CSRF protection ────────────────────────────────────────────────────
  // Applied to every state-mutating API route that isn't exempt.
  if (
    pathname.startsWith("/api/") &&
    !CSRF_EXEMPT.some((p) => pathname.startsWith(p))
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