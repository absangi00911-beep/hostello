import { describe, expect, it } from "vitest";
import { ADMIN_WORKSPACE_NAVIGATION } from "./adminNavigation";

describe("ADMIN_WORKSPACE_NAVIGATION", () => {
  it("contains only supported admin destinations", () => {
    expect(ADMIN_WORKSPACE_NAVIGATION).toEqual([
      { href: "/admin", label: "Overview" },
      { href: "/admin/listings", label: "Listing review" },
      { href: "/admin/bookings", label: "Bookings" },
      { href: "/admin/verifications", label: "Student verification" },
      { href: "/admin/roommate-reports", label: "Roommate reports" },
      { href: "/admin/payouts", label: "Payouts" },
      { href: "/admin/refunds", label: "Refunds" },
      { href: "/admin/payment-events", label: "Payment events" },
      { href: "/admin/search-sync", label: "Search index" },
    ]);
  });
});
