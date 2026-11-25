import type { WorkspaceNavigationItem } from "@/components/layout/WorkspaceShell";

export const OWNER_WORKSPACE_NAVIGATION = [
  { href: "/owner", label: "Dashboard" },
  { href: "/owner/listings/new", label: "Add a listing" },
  { href: "/owner/bookings", label: "Bookings" },
  { href: "/owner/reviews", label: "Reviews" },
  { href: "/owner/analytics", label: "Analytics" },
  { href: "/owner/earnings", label: "Earnings" },
  { href: "/owner/subscription", label: "Subscription" },
] as const satisfies readonly WorkspaceNavigationItem[];
