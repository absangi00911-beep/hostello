"use client";

import { Banknote, Compass, Star, UsersRound } from "lucide-react";

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

export function BrowseCategoryNav({
  category,
  onSelectCategory,
  className = "browse-category-nav",
}: {
  category: Category;
  onSelectCategory: (category: Category) => void;
  className?: string;
}) {
  return (
    <nav aria-label="Browse categories" className={className}>
      {categories.map(({ id, label, icon: Icon }) => (
        <button
          aria-pressed={category === id}
          className="browse-category"
          data-category={id}
          key={id}
          onClick={() => onSelectCategory(id)}
          type="button"
        >
          <Icon aria-hidden="true" size={20} strokeWidth={1.7} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
