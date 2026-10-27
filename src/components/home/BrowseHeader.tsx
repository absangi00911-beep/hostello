"use client";

import Link from "next/link";
import {
  BrowseAccountActions,
} from "@/components/auth/BrowseAccountActions";
import type { BrowseAccountUser } from "@/components/auth/BrowseAccountMenu";
import {
  Banknote,
  Compass,
  Star,
  UsersRound,
} from "lucide-react";

export type Category = "all" | "women" | "top-rated" | "budget";

const categories = [
  { id: "all", label: "All stays", icon: Compass },
  { id: "women", label: "Women-only", icon: UsersRound },
  { id: "top-rated", label: "Top rated", icon: Star },
  { id: "budget", label: "Under PKR 20k", icon: Banknote },
] satisfies {
  id: Category;
  label: string;
  icon: typeof Compass;
}[];

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

        <nav className="browse-category-nav" aria-label="Browse categories">
          {categories.map(({ id, label, icon: Icon }) => (
            <button
              aria-pressed={category === id}
              className="browse-category"
              key={id}
              onClick={() => onSelectCategory(id)}
              type="button"
            >
              <Icon aria-hidden="true" size={20} strokeWidth={1.7} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <BrowseAccountActions user={accountUser} />
      </div>
    </header>
  );
}
