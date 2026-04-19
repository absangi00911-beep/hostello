"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, GitCompareArrows } from "lucide-react";
import { useCompareStore } from "@/stores/compare";

export function CompareBar() {
  const { items, remove, clear } = useCompareStore();

  return (
    <AnimatePresence>
      {items.length >= 2 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4"
        >
          <div className="bg-[var(--color-primary-950)] text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3">
            {/* Items */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {items.map((item) => (
                <div
                  key={item.slug}
                  className="relative flex-shrink-0 group"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 border border-white/20">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
                        {item.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => remove(item.slug)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Remove ${item.name}`}
                  >
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
              ))}
              <span className="text-xs text-white/60 ml-1 truncate">
                {items.length} hostel{items.length !== 1 ? "s" : ""} selected
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={clear}
                className="text-xs text-white/50 hover:text-white/80 transition-colors px-2 py-1"
              >
                Clear
              </button>
              <Link
                href={`/hostels/compare?${items.map((i) => `slug=${i.slug}`).join("&")}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-accent-500)] text-white text-xs font-semibold hover:bg-[var(--color-accent-600)] transition-colors"
              >
                <GitCompareArrows className="w-3.5 h-3.5" />
                Compare
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
