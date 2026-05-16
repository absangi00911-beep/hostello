// Path: src/app/hostels/SearchPageClient.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Map, List, ChevronDown } from "lucide-react";
import { HostelCard, type HostelCardData } from "@/components/hostel/HostelCard";
import { FilterSidebar, MobileFilterSheet, type FilterState } from "@/components/hostel/FilterSidebar";
import { Pagination } from "@/components/hostel/Pagination";
import {
  PageSpinner,
  SkeletonCard,
  SearchDegradedNotice,
  EmptyState,
  InlineError,
} from "@/components/ui/shared";
import { Building2 } from "lucide-react";

/* -- Types ------------------------------------------------- */
interface SearchResponse {
  data: HostelCardData[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  isSearchDegraded: boolean;
}

type SortOption = "newest" | "price_asc" | "price_desc" | "rating";

const SORT_LABELS: Record<SortOption, string> = {
  newest:     "Recommended",
  price_asc:  "Price: low to high",
  price_desc: "Price: high to low",
  rating:     "Highest rated",
};

const DEFAULT_FILTERS: FilterState = {
  city:       "",
  gender:     "",
  minPrice:   0,
  maxPrice:   50_000,
  amenities:  [],
};

const PAGE_SIZE = 20;

/* -- URL ↔ state helpers ----------------------------------- */
function filtersToParams(
  filters: FilterState,
  sort: SortOption,
  page: number,
  q: string
): URLSearchParams {
  const p = new URLSearchParams();
  if (q)                       p.set("q",        q);
  if (filters.city)            p.set("city",     filters.city);
  if (filters.gender)          p.set("gender",   filters.gender);
  if (filters.minPrice > 0)    p.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice < 50_000) p.set("maxPrice", String(filters.maxPrice));
  filters.amenities.forEach((a) => p.append("amenities", a));
  if (sort !== "newest")       p.set("sort",  sort);
  if (page > 1)                p.set("page",  String(page));
  return p;
}

function countActiveFilters(f: FilterState): number {
  let n = 0;
  if (f.city)            n++;
  if (f.gender)          n++;
  if (f.minPrice > 0 || f.maxPrice < 50_000) n++;
  if (f.amenities.length) n += f.amenities.length;
  return n;
}

/* -- Props from server page -------------------------------- */
export interface SearchPageClientProps {
  initialQ:        string;
  initialCity:     string;
  initialGender:   "" | "MALE" | "FEMALE" | "MIXED";
  initialMinPrice: number;
  initialMaxPrice: number;
  initialAmenities:string[];
  initialSort:     SortOption;
  initialPage:     number;
}

export function SearchPageClient({
  initialQ,
  initialCity,
  initialGender,
  initialMinPrice,
  initialMaxPrice,
  initialAmenities,
  initialSort,
  initialPage,
}: SearchPageClientProps) {
  const router   = useRouter();
  const pathname = usePathname();

  // Applied (active) filters
  const [q,       setQ]       = useState(initialQ);
  const [filters, setFilters] = useState<FilterState>({
    city:      initialCity,
    gender:    initialGender,
    minPrice:  initialMinPrice,
    maxPrice:  initialMaxPrice,
    amenities: initialAmenities,
  });
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [page, setPage] = useState(initialPage);

  // Pending filters (mobile — only applied on "Apply" tap)
  const [pendingFilters, setPendingFilters] = useState<FilterState>(filters);

  const [mapView, setMapView] = useState(false);

  // Sync URL whenever applied state changes
  useEffect(() => {
    const params = filtersToParams(filters, sort, page, q);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [filters, sort, page, q, pathname, router]);

  /* -- Fetch ------------------------------------------------ */
  const queryKey = ["hostels", q, filters, sort, page] as const;

  const { data, isLoading, isError, error } = useQuery<SearchResponse>({
    queryKey,
    queryFn: async () => {
      const params = filtersToParams(filters, sort, page, q);
      params.set("limit", String(PAGE_SIZE));
      const res = await fetch(`/api/hostels?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const activeCount = countActiveFilters(filters);

  /* -- Handlers --------------------------------------------- */
  // Desktop: apply immediately on filter change
  function handleDesktopFilterChange(next: FilterState) {
    setFilters(next);
    setPendingFilters(next);
    setPage(1);
  }

  // Mobile: only update pending
  function handlePendingChange(next: FilterState) {
    setPendingFilters(next);
  }

  // Mobile: commit pending to applied
  function handleApplyMobile() {
    setFilters(pendingFilters);
    setPage(1);
  }

  function handleReset() {
    setFilters(DEFAULT_FILTERS);
    setPendingFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  function handleSortChange(next: SortOption) {
    setSort(next);
    setPage(1);
  }

  function handlePageChange(next: number) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  /* -- Results summary text --------------------------------- */
  function resultsSummary(): string {
    if (!data) return "";
    const { total } = data;
    if (total === 0) return "No hostels found";
    const cityLabel = filters.city ? ` in ${filters.city}` : "";
    return `${total.toLocaleString()} hostel${total === 1 ? "" : "s"}${cityLabel}`;
  }

  return (
    <div className="container-app py-6">
      {/* -- Controls row ------------------------------------ */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Mobile filter button */}
        <MobileFilterSheet
          filters={filters}
          pendingFilters={pendingFilters}
          onPendingChange={handlePendingChange}
          onApply={handleApplyMobile}
          onReset={handleReset}
          activeCount={activeCount}
        />

        {/* Results summary */}
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] flex-1 min-w-0 truncate">
          {isLoading ? "Searching…" : resultsSummary()}
        </p>

        {/* Sort — above results, not in sidebar */}
        <div className="relative">
          <div className="flex items-center gap-1.5 h-9 px-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] cursor-pointer hover:border-[var(--color-border-strong)]">
            <label
              htmlFor="sort-select"
              className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] whitespace-nowrap cursor-pointer"
            >
              Sort:
            </label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="appearance-none bg-transparent text-[var(--text-body-sm)] font-[500] text-[var(--color-text-body)] pr-5 focus:outline-none cursor-pointer"
            >
              {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                )
              )}
            </select>
            <ChevronDown
              size={13}
              strokeWidth={1.5}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Map toggle */}
        <button
          onClick={() => setMapView((v) => !v)}
          className={`hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-[var(--radius-md)] border text-[var(--text-body-sm)] font-[500] transition-colors duration-[var(--transition-fast)] ${
            mapView
              ? "border-[var(--color-primary)] bg-[var(--color-primary-faint)] text-[var(--color-primary-deep)]"
              : "border-[var(--color-border-default)] bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-body)]"
          }`}
          aria-pressed={mapView}
        >
          {mapView ? (
            <List size={15} strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Map size={15} strokeWidth={1.5} aria-hidden="true" />
          )}
          {mapView ? "List" : "Map"}
        </button>
      </div>

      {/* -- Layout: sidebar + content ---------------------- */}
      <div className="flex gap-6 items-start">
        {/* Desktop filter sidebar */}
        <FilterSidebar
          filters={filters}
          onChange={handleDesktopFilterChange}
          onReset={handleReset}
        />

        {/* Main content */}
        <main className="flex-1 min-w-0" aria-label="Search results">
          {/* Degraded search notice */}
          {data?.isSearchDegraded && <SearchDegradedNotice />}

          {/* Active filter chips */}
          {activeCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4" role="list" aria-label="Active filters">
              {filters.city && (
                <FilterChip
                  label={filters.city}
                  onRemove={() => handleDesktopFilterChange({ ...filters, city: "" })}
                />
              )}
              {filters.gender && (
                <FilterChip
                  label={{ MALE: "Male only", FEMALE: "Female only", MIXED: "Mixed" }[filters.gender]}
                  onRemove={() => handleDesktopFilterChange({ ...filters, gender: "" })}
                />
              )}
              {(filters.minPrice > 0 || filters.maxPrice < 50_000) && (
                <FilterChip
                  label={`PKR ${filters.minPrice.toLocaleString()}–${filters.maxPrice.toLocaleString()}`}
                  onRemove={() =>
                    handleDesktopFilterChange({ ...filters, minPrice: 0, maxPrice: 50_000 })
                  }
                />
              )}
              {filters.amenities.map((a) => (
                <FilterChip
                  key={a}
                  label={a}
                  onRemove={() =>
                    handleDesktopFilterChange({
                      ...filters,
                      amenities: filters.amenities.filter((x) => x !== a),
                    })
                  }
                />
              ))}
            </div>
          )}

          {/* Error */}
          {isError && (
            <InlineError
              message={
                error instanceof Error
                  ? error.message
                  : "Search failed. Please try again."
              }
            />
          )}

          {/* Loading skeletons */}
          {isLoading && (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-5"
              aria-busy="true"
              aria-label="Loading results"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Results grid */}
          {!isLoading && data && data.data.length > 0 && (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-5"
              role="list"
              aria-label={resultsSummary()}
            >
              {data.data.map((hostel) => (
                <div key={hostel.id} role="listitem">
                  <HostelCard hostel={hostel} />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && data && data.data.length === 0 && (
            <EmptyState
              icon={Building2}
              heading="No hostels match your filters"
              description="Try removing a filter or searching a nearby area."
              action={
                activeCount > 0 ? (
                  <button
                    onClick={handleReset}
                    className="inline-flex h-9 items-center px-4 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-inverse)] hover:bg-[var(--color-action-dark)] transition-colors duration-[var(--transition-base)]"
                  >
                    Clear all filters
                  </button>
                ) : undefined
              }
            />
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </main>
      </div>
    </div>
  );
}

/* -- Active filter chip ------------------------------------- */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      role="listitem"
      className="inline-flex items-center gap-1.5 h-7 pl-3 pr-2 rounded-full bg-[var(--color-primary-faint)] border border-[var(--color-primary-light)] text-[var(--text-caption)] font-[500] text-[var(--color-primary-deep)]"
    >
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-[var(--color-primary-light)] transition-colors duration-[var(--transition-fast)]"
      >
        <span aria-hidden="true" className="text-[10px] leading-none">✕</span>
      </button>
    </span>
  );
}
