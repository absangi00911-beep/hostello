"use client";

import Link from "next/link";
import { ScrollAwareSurface } from "./ScrollAwareSurface";
import {
  getProductNavigationTabs,
  type ProductNavigationRole,
  type ProductNavigationTabId,
} from "@/lib/product-navigation";

export function MobileTabNavigation({
  activeTab,
  role,
}: {
  activeTab: ProductNavigationTabId;
  role: ProductNavigationRole;
}) {
  if (role !== null && role !== "STUDENT") return null;

  const visibleTabs = getProductNavigationTabs(role);

  return (
    <ScrollAwareSurface
      as="nav"
      ariaLabel={role === "STUDENT" ? "Student navigation" : "Main navigation"}
      className={`fixed inset-x-0 bottom-0 z-[100] hidden min-h-16 ${
        role === "STUDENT" ? "grid-cols-5" : "grid-cols-3"
      } bg-[rgb(255_255_255_/_96%)] px-2 pt-[6px] pb-[calc(6px+env(safe-area-inset-bottom))] backdrop-blur-[12px] [@media(max-width:720px)]:grid`}
      scrolledClassName="shadow-[0_-4px_12px_rgb(0_0_0_/_8%)]"
    >
      {visibleTabs.map(({ id, label, href, icon: Icon }) => (
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
    </ScrollAwareSurface>
  );
}
