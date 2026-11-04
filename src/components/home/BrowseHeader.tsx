"use client";

import {
  BrowseAccountActions,
} from "@/components/auth/BrowseAccountActions";
import type { BrowseAccountUser } from "@/components/auth/BrowseAccountMenu";
import { SiteHeader } from "@/components/layout/SiteHeader";
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
    <SiteHeader
      actions={<BrowseAccountActions user={accountUser} />}
      center={
        <BrowseCategoryNav
          category={category}
          onSelectCategory={onSelectCategory}
        />
      }
      hideOnMobile={hideOnMobile}
      user={accountUser}
    />
  );
}
