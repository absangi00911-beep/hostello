import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

const PROTECTED  = ["/dashboard", "/profile", "/bookings", "/favorites"];
const ADMIN_ONLY = ["/admin"];
const AUTH_ONLY  = ["/login", "/signup"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn   = !!req.auth;
  const role         = req.auth?.user?.role;

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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
