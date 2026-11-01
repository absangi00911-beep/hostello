"use client";

import {
  BrowseAccountActions,
} from "@/components/auth/BrowseAccountActions";
import { HostelloBrand } from "@/components/brand/HostelloBrand";
import type { BrowseAccountUser } from "@/components/auth/BrowseAccountMenu";
import { BrowseCategoryNav, type Category } from "./BrowseCategoryNav";

export type { Category } from "./BrowseCategoryNav";

export function BrowseHeader({
  accountUser,
  category,
  onSelectCategory,
}: {
  accountUser: BrowseAccountUser | null;
  category: Category;
  onSelectCategory: (category: Category) => void;
}) {
  const hideOnMobile = !accountUser || accountUser.role === "STUDENT";

  return (
    <header
      className={`bg-[#fcfcfb] ${
        hideOnMobile ? "[@media(max-width:720px)]:hidden" : ""
      }`}
    >
      <div className="mx-auto grid min-h-20 w-[min(1920px,calc(100%-var(--page-gutter-total)))] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center [@media(max-width:960px)]:w-[min(calc(100%-var(--page-gutter-tablet)),1344px)] [@media(max-width:960px)]:grid-cols-[minmax(120px,1fr)_auto_minmax(140px,1fr)] [@media(max-width:720px)]:w-[min(calc(100%-var(--page-gutter-mobile)),600px)]! [@media(max-width:720px)]:pt-2 [@media(max-width:420px)]:w-[calc(100%-var(--page-gutter-mobile))] [@media(max-width:420px)]:min-h-[68px]">
        <HostelloBrand
          className="inline-flex w-fit items-center text-xl font-[750] tracking-[-0.045em] text-brand [font-family:'Arial_Rounded_MT_Bold','Trebuchet_MS',var(--font-inter),sans-serif]"
        />

        <BrowseCategoryNav
          category={category}
          onSelectCategory={onSelectCategory}
        />

        <BrowseAccountActions user={accountUser} />
      </div>
    </header>
  );
}
