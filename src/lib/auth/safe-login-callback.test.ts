import { describe, expect, it } from "vitest";
import { getSafeLoginCallbackUrl } from "@/lib/auth/safe-login-callback";

describe("getSafeLoginCallbackUrl", () => {
  it.each([
    "/trips",
    "/profile",
    "/profile/verification",
    "/wishlists",
    "/notifications",
    "/owner",
    "/owner/listings/new",
    "/admin",
    "/admin/refunds",
    "/admin/payment-events",
    "/bookings/clx9abc_DEF-123",
    "/owner/listings/clx9abc/edit",
    "/owner/listings/clx9abc/blocked-dates",
    "/hostels/sunrise-hostel-lahore/roommates",
  ])("returns users to %s after login", (path) => {
    expect(getSafeLoginCallbackUrl(path)).toBe(path);
  });

  it("keeps the existing messages rules", () => {
    expect(getSafeLoginCallbackUrl("/messages")).toBe("/messages");
    expect(getSafeLoginCallbackUrl("/messages?pendingInquiry=1")).toBe("/messages?pendingInquiry=1");
    expect(getSafeLoginCallbackUrl("/messages?conversationId=abc_123")).toBe("/messages?conversationId=abc_123");
    expect(getSafeLoginCallbackUrl("/messages?conversationId=a/b")).toBe("/");
    expect(getSafeLoginCallbackUrl("/messages?pendingInquiry=1&x=2")).toBe("/");
  });

  it("returns to the alerts page but drops its prefill query", () => {
    expect(getSafeLoginCallbackUrl("/student/availability-alerts?hostel=h1&from=2026-12-01"))
      .toBe("/student/availability-alerts");
  });

  it.each([
    ["absolute URL", "https://evil.example/trips"],
    ["protocol-relative URL", "//evil.example"],
    ["backslash trick", "/\\evil.example"],
    ["encoded double slash", "/%2F%2Fevil.example"],
    ["javascript URL", "javascript:alert(1)"],
    ["userinfo trick", "/trips@evil.example"],
    ["path traversal out of the allowlist", "/trips/../../evil"],
    ["traversal that normalizes to an unknown page", "/trips/../settings"],
    ["encoded traversal in an id", "/bookings/%2e%2e%2fadmin"],
    ["id with a slash", "/bookings/a/b"],
    ["id that is too long", `/bookings/${"a".repeat(129)}`],
    ["control character", "/trips\n"],
    ["unknown page", "/settings"],
    ["prefix of an allowed page", "/trips-evil"],
    ["child of an allowed page", "/admin/users"],
    ["trailing slash variant", "/trips/"],
    ["extra query on an exact path", "/trips?next=https://evil.example"],
    ["missing leading slash", "trips"],
    ["empty string", ""],
  ])("falls back to the home page for %s", (_label, value) => {
    expect(getSafeLoginCallbackUrl(value)).toBe("/");
  });

  it("falls back to the home page for non-string input", () => {
    expect(getSafeLoginCallbackUrl(undefined)).toBe("/");
    expect(getSafeLoginCallbackUrl(["/trips", "/profile"])).toBe("/");
  });

  it("normalizes a path that resolves into the allowlist instead of echoing the raw input", () => {
    expect(getSafeLoginCallbackUrl("/admin/./refunds")).toBe("/admin/refunds");
    expect(getSafeLoginCallbackUrl("/trips#fragment")).toBe("/trips");
  });
});
