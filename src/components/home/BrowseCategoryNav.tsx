"use client";

import {
  Banknote,
  Compass,
  Star,
  Users,
  type HostelloIcon,
} from "@/components/icons/HostelloIcons";

export type Category = "all" | "women" | "top-rated" | "budget";

const categories = [
  { id: "all", label: "All stays", icon: Compass },
  { id: "women", label: "Women-only", icon: Users },
  { id: "top-rated", label: "Top rated", icon: Star },
  { id: "budget", label: "Under PKR 20k", icon: Banknote },
] satisfies {
  id: Category;
  label: string;
  icon: HostelloIcon;
}[];

export function BrowseCategoryNav({
  category,
  onSelectCategory,
  className = "",
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
              ? "relative flex min-h-[44px] min-w-max cursor-pointer flex-row items-center justify-center gap-[7px] rounded-lg border border-line bg-surface px-3 py-[7px] text-meta font-[550] whitespace-nowrap text-muted transition-colors duration-[160ms] hover:text-ink aria-pressed:border-ink aria-pressed:bg-surface-muted aria-pressed:text-ink [@media(max-width:720px)]:after:hidden"
              : "relative flex min-w-[70px] cursor-pointer flex-col items-center justify-center gap-[5px] border-0 bg-transparent px-[2px] pt-2 pb-[10px] text-meta font-[550] whitespace-nowrap text-muted transition-colors duration-[160ms] hover:text-ink aria-pressed:text-ink after:pointer-events-none after:absolute after:inset-x-0 after:bottom-3 after:h-0.5 after:rounded-full after:bg-line after:opacity-0 after:transition-opacity after:duration-[160ms] motion-reduce:after:transition-none hover:after:opacity-100 aria-pressed:after:bg-ink aria-pressed:after:opacity-100 [@media(max-width:960px)]:min-w-[58px] [@media(max-width:420px)]:min-w-16"
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
