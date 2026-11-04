import {
  CalendarDays,
  Compass,
  Heart,
  MessageCircle,
  UserRound,
} from "lucide-react";

export type ProductNavigationRole = "STUDENT" | "OWNER" | "ADMIN" | null;

export interface AccountNavigationItem {
  label: string;
  href: string;
}

export const productNavigationTabs = [
  { id: "explore", label: "Explore", href: "/", icon: Compass },
  { id: "wishlists", label: "Wishlists", href: "/wishlists", icon: Heart },
  { id: "trips", label: "Trips", href: "/trips", icon: CalendarDays },
  { id: "messages", label: "Messages", href: "/messages", icon: MessageCircle },
  { id: "profile", label: "Profile", href: "/profile", icon: UserRound },
] as const;

export type ProductNavigationTab = (typeof productNavigationTabs)[number];
export type ProductNavigationTabId = ProductNavigationTab["id"];

const ownerNavigationItems: AccountNavigationItem[] = [
  { label: "Dashboard", href: "/owner" },
  { label: "Create listing", href: "/owner/listings/new" },
  { label: "Bookings", href: "/owner/bookings" },
  { label: "Messages", href: "/messages" },
  { label: "Reviews", href: "/owner/reviews" },
  { label: "Analytics", href: "/owner/analytics" },
  { label: "Earnings", href: "/owner/earnings" },
  { label: "Subscription", href: "/owner/subscription" },
];

const adminNavigationItems: AccountNavigationItem[] = [
  { label: "Admin console", href: "/admin" },
  { label: "Listings", href: "/admin/listings" },
  { label: "Verifications", href: "/admin/verifications" },
  { label: "Roommate reports", href: "/admin/roommate-reports" },
  { label: "Payment events", href: "/admin/payment-events" },
  { label: "Refunds", href: "/admin/refunds" },
  { label: "Payouts", href: "/admin/payouts" },
  { label: "Search sync", href: "/admin/search-sync" },
];

const notificationNavigationItem: AccountNavigationItem = {
  label: "Notifications",
  href: "/notifications",
};

export function getAccountNavigationItems(
  role: Exclude<ProductNavigationRole, null>,
): AccountNavigationItem[] {
  const roleItems =
    role === "STUDENT"
      ? productNavigationTabs.map(({ label, href }) => ({ label, href }))
      : role === "OWNER"
        ? ownerNavigationItems
        : adminNavigationItems;

  return [...roleItems, notificationNavigationItem];
}

export function getProductNavigationTabs(
  role: ProductNavigationRole,
): ProductNavigationTab[] {
  switch (role) {
    case "STUDENT":
      return [...productNavigationTabs];
    case "OWNER":
      return productNavigationTabs.filter(
        (tab) => tab.id === "explore" || tab.id === "messages",
      );
    case "ADMIN":
      return productNavigationTabs.filter((tab) => tab.id === "explore");
    case null:
      return productNavigationTabs.filter(
        (tab) =>
          tab.id === "explore" ||
          tab.id === "wishlists" ||
          tab.id === "profile",
      );
  }
}
