"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { SearchFilters } from "./search-filters";

interface MobileFilterSheetProps {
  initialParams: Record<string, string | string[]>;
  children: React.ReactNode;
}

export function MobileFilterSheet({ initialParams, children }: MobileFilterSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Sheet */}
          <div className="relative ml-auto w-full max-w-sm bg-white h-full overflow-y-auto shadow-xl animate-slide-right">
            <div className="sticky top-0 bg-white border-b border-[var(--color-border)] px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-base font-semibold">Filters</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--color-sand-100)] transition-colors"
                aria-label="Close filters"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-5">
              <SearchFilters
                initialParams={initialParams}
                onClose={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
