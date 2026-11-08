const LOGIN_CALLBACK_ORIGIN = "https://hostello.invalid";

// Pages that send people to /login and expect to get them back afterwards.
// This is an allowlist of exact paths, never a prefix match, so a callback can
// only ever land on a page the app itself links here from.
const RETURN_PATHS = new Set([
  "/wishlists",
  "/trips",
  "/notifications",
  "/profile",
  "/profile/verification",
  "/owner",
  "/owner/analytics",
  "/owner/bookings",
  "/owner/earnings",
  "/owner/listings/new",
  "/owner/reviews",
  "/owner/subscription",
  "/admin",
  "/admin/bookings",
  "/admin/listings",
  "/admin/payment-events",
  "/admin/payouts",
  "/admin/refunds",
  "/admin/roommate-reports",
  "/admin/search-sync",
  "/admin/verifications",
]);

// The one return path that is allowed to arrive with a query string. The
// query (form prefill) is dropped rather than trusted.
const PATH_ONLY_RETURN = "/student/availability-alerts";

const ID = "[A-Za-z0-9_-]{1,128}";
const RETURN_PATTERNS = [
  new RegExp(`^/bookings/${ID}$`),
  new RegExp(`^/owner/listings/${ID}/(?:edit|blocked-dates)$`),
  new RegExp(`^/hostels/${ID}/roommates$`),
];

export function getSafeLoginCallbackUrl(value: string | string[] | undefined) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return "/";
  }

  let callback: URL;
  try {
    callback = new URL(value, LOGIN_CALLBACK_ORIGIN);
  } catch {
    return "/";
  }

  if (callback.origin !== LOGIN_CALLBACK_ORIGIN) return "/";

  if (callback.pathname !== "/messages") {
    // Always return the normalized pathname, never the raw input.
    if (callback.pathname === PATH_ONLY_RETURN) return PATH_ONLY_RETURN;
    const isKnownPath =
      RETURN_PATHS.has(callback.pathname) ||
      RETURN_PATTERNS.some((pattern) => pattern.test(callback.pathname));
    return isKnownPath && callback.search === "" ? callback.pathname : "/";
  }

  const entries = [...callback.searchParams.entries()];
  if (
    entries.length === 1 &&
    entries[0][0] === "pendingInquiry" &&
    entries[0][1] === "1"
  ) {
    return "/messages?pendingInquiry=1";
  }

  if (
    entries.length === 1 &&
    entries[0][0] === "conversationId" &&
    /^[A-Za-z0-9_-]{1,128}$/.test(entries[0][1])
  ) {
    return `/messages?conversationId=${encodeURIComponent(entries[0][1])}`;
  }

  return entries.length === 0 ? "/messages" : "/";
}
