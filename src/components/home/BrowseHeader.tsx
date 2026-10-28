"use client";

import Link from "next/link";
import {
  BrowseAccountActions,
} from "@/components/auth/BrowseAccountActions";
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
  return (
    <header className="browse-header">
      <div className="browse-shell browse-header-inner">
        <Link className="browse-brand" href="/" aria-label="hostello home">
          <span>hostello</span>
        </Link>

        <BrowseCategoryNav
          category={category}
          onSelectCategory={onSelectCategory}
        />

        <BrowseAccountActions user={accountUser} />
      </div>
    </header>
  );
}
