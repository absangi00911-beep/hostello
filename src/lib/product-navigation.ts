import {
  CalendarDays,
  Compass,
  Heart,
  MessageCircle,
  UserRound,
} from "lucide-react";

export type ProductNavigationRole = "STUDENT" | "OWNER" | "ADMIN" | null;

export const productNavigationTabs = [
  { id: "explore", label: "Explore", href: "/", icon: Compass },
  { id: "wishlists", label: "Wishlists", href: "/wishlists", icon: Heart },
  { id: "trips", label: "Trips", href: "/trips", icon: CalendarDays },
  { id: "messages", label: "Messages", href: "/messages", icon: MessageCircle },
  { id: "profile", label: "Profile", href: "/profile", icon: UserRound },
] as const;

export type ProductNavigationTab = (typeof productNavigationTabs)[number];
export type ProductNavigationTabId = ProductNavigationTab["id"];

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
