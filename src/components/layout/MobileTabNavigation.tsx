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
    <nav
      aria-label="Student navigation"
      className="fixed inset-x-0 bottom-0 z-[100] hidden min-h-16 grid-cols-5 border-t border-line bg-[rgb(255_255_255_/_96%)] px-2 pt-[6px] pb-[calc(6px+env(safe-area-inset-bottom))] backdrop-blur-[12px] [@media(max-width:720px)]:grid"
    >
      {tabs.map(({ id, label, href, icon: Icon }) => (
        <Link
          aria-current={activeTab === id ? "page" : undefined}
          className="flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-[3px] rounded-[10px] text-[0.66rem] font-[550] text-muted no-underline data-[active=true]:font-bold data-[active=true]:text-brand-dark focus-visible:outline-2! focus-visible:outline-brand! focus-visible:outline-offset-[-2px]!"
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
