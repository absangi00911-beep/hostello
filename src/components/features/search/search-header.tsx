import { SlidersHorizontal, Search, MapPin } from "lucide-react";
import { MobileFilterSheet } from "@/components/features/search/mobile-filter-sheet";

interface SearchHeaderProps {
  params: Record<string, string | string[]>;
}

function getTitle(params: Record<string, string | string[]>): string {
  const city   = typeof params.city   === "string" ? params.city   : null;
  const gender = typeof params.gender === "string" ? params.gender : null;
  const q      = typeof params.q      === "string" ? params.q      : null;

  if (q) return `Results for "${q}"`;
  if (city && gender) {
    const g = gender === "MALE" ? "Boys" : gender === "FEMALE" ? "Girls" : "Mixed";
    return `${g} hostels in ${city}`;
  }
  if (city) return `Hostels in ${city}`;
  return "Browse hostels across Pakistan";
}

export function SearchHeader({ params }: SearchHeaderProps) {
  const title = getTitle(params);

  return (
    <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex items-center justify-between gap-4">
          <h1
            className="text-xl sm:text-2xl font-extrabold text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h1>

          {/* Mobile filter trigger */}
          <div className="lg:hidden">
            <MobileFilterSheet initialParams={params}>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-ground)] transition-colors">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </MobileFilterSheet>
          </div>
        </div>
      </div>
    </div>
  );
}
