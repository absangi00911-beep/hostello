"use client";

import Link from "next/link";
import {
  CalendarDays,
  Compass,
  Heart,
  MessageCircle,
  UserRound,
} from "lucide-react";

const tabs = [
  { id: "explore", label: "Explore", href: "/", icon: Compass },
  { id: "wishlists", label: "Wishlists", href: "/wishlists", icon: Heart },
  { id: "trips", label: "Trips", href: "/trips", icon: CalendarDays },
  { id: "messages", label: "Messages", href: "/messages", icon: MessageCircle },
  { id: "profile", label: "Profile", href: "/profile", icon: UserRound },
] as const;

export type MobileTab = (typeof tabs)[number]["id"];

export function MobileTabNavigation({ activeTab }: { activeTab: MobileTab }) {
  return (
    <nav aria-label="Student navigation" className="mobile-tab-navigation">
      {tabs.map(({ id, label, href, icon: Icon }) => (
        <Link
          aria-current={activeTab === id ? "page" : undefined}
          className="mobile-tab-link"
          data-active={activeTab === id ? "true" : undefined}
          href={href}
          key={id}
        >
          <Icon aria-hidden="true" size={22} strokeWidth={1.8} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
