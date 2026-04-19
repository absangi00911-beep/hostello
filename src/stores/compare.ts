"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CompareItem } from "@/types";

const MAX_COMPARE = 3;

interface CompareStore {
  items: CompareItem[];
  add: (item: CompareItem) => void;
  remove: (slug: string) => void;
  toggle: (item: CompareItem) => void;
  clear: () => void;
  has: (slug: string) => boolean;
  isFull: () => boolean;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        const { items } = get();
        if (items.length >= MAX_COMPARE) return;
        if (items.some((i) => i.slug === item.slug)) return;
        set({ items: [...items, item] });
      },
      remove: (slug) => {
        set({ items: get().items.filter((i) => i.slug !== slug) });
      },
      toggle: (item) => {
        const { has, add, remove } = get();
        has(item.slug) ? remove(item.slug) : add(item);
      },
      clear: () => set({ items: [] }),
      has: (slug) => get().items.some((i) => i.slug === slug),
      isFull: () => get().items.length >= MAX_COMPARE,
    }),
    {
      name: "hostello-compare",
    }
  )
);
