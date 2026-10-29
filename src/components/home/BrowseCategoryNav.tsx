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
  variant = "header",
}: {
  category: Category;
  onSelectCategory: (category: Category) => void;
  className?: string;
  variant?: "header" | "mobile";
}) {
  const navClassName =
    variant === "mobile"
      ? `${className} hidden min-h-[50px] items-center gap-2 overflow-x-auto py-[3px] pr-px pb-[9px] pl-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [@media(max-width:720px)]:flex`
      : `${className} flex h-20 items-stretch gap-[clamp(16px,2.5vw,32px)] [@media(max-width:960px)]:justify-center [@media(max-width:960px)]:gap-[10px] [@media(max-width:720px)]:justify-start [@media(max-width:720px)]:gap-[22px] [@media(max-width:720px)]:overflow-x-auto [@media(max-width:720px)]:[scrollbar-width:none] [@media(max-width:720px)]:[&::-webkit-scrollbar]:hidden [@media(max-width:420px)]:gap-[17px]`;

  return (
    <nav aria-label="Browse categories" className={navClassName}>
      {categories.map(({ id, label, icon: Icon }) => (
        <button
          aria-pressed={category === id}
          className={
            variant === "mobile"
              ? "browse-category relative flex min-h-[44px] min-w-max cursor-pointer flex-row items-center justify-center gap-[7px] rounded-full border border-line bg-white px-3 py-[7px] text-[0.76rem] font-[550] whitespace-nowrap text-muted transition-colors duration-[160ms] hover:text-ink aria-pressed:border-ink aria-pressed:bg-surface-muted aria-pressed:text-ink [@media(max-width:720px)]:after:hidden"
              : "browse-category relative flex min-w-[70px] cursor-pointer flex-col items-center justify-center gap-[5px] border-0 bg-transparent px-[2px] pt-2 pb-[10px] text-[0.76rem] font-[550] whitespace-nowrap text-muted transition-colors duration-[160ms] hover:text-ink aria-pressed:text-ink [@media(max-width:960px)]:min-w-[58px] [@media(max-width:960px)]:text-[0.68rem] [@media(max-width:420px)]:min-w-16 [@media(max-width:420px)]:text-[0.7rem]"
          }
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
