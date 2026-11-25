import type { WorkspaceNavigationItem } from "@/components/layout/WorkspaceShell";

export const ADMIN_WORKSPACE_NAVIGATION = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/listings", label: "Listing review" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/verifications", label: "Student verification" },
  { href: "/admin/roommate-reports", label: "Roommate reports" },
  { href: "/admin/payouts", label: "Payouts" },
  { href: "/admin/refunds", label: "Refunds" },
  { href: "/admin/payment-events", label: "Payment events" },
  { href: "/admin/search-sync", label: "Search index" },
] as const satisfies readonly WorkspaceNavigationItem[];
