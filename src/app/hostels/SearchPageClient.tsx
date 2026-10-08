// Path: src/app/hostels/SearchPageClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Map, List, ChevronDown } from "lucide-react";
import { HostelCard, type HostelCardData } from "@/components/hostel/HostelCard";
import { Button } from "@/components/ui/button";
import { FilterSidebar, MobileFilterSheet, type FilterState } from "@/components/hostel/FilterSidebar";
import { Pagination } from "@/components/hostel/Pagination";
import {
  SkeletonCard,
  SearchDegradedNotice,
  EmptyState,
  InlineError,
  RecoveryNotice,
  PageSpinner,
} from "@/components/ui/shared";
import { Building2 } from "lucide-react";
import { SearchMap } from "@/components/hostel/SearchMap";
import { CompareToggle } from "@/components/hostel/CompareToggle";
import { CompareTray, type CompareItem } from "@/components/hostel/CompareTray";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ── Types ───────────────────────────────────────────────── */
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

/* ── URL ↔ state helpers ─────────────────────────────────── */
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

/* ── Props from server page ──────────────────────────────── */
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
  const [q]                  = useState(initialQ);
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
  // Card <-> pin sync, only meaningful once the map panel is actually
  // visible alongside the list (see the split-view layout below).
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Compare selection — session-only (not persisted), capped at 3 to match
  // CompareTray's fixed three slots and the compare page's own limit.
  const [compareItems, setCompareItems] = useState<CompareItem[]>([]);
  function toggleCompare(hostel: HostelCardData) {
    setCompareItems((prev) => {
      if (prev.some((i) => i.id === hostel.id)) {
        return prev.filter((i) => i.id !== hostel.id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, { id: hostel.id, name: hostel.name, slug: hostel.slug }];
    });
  }

  // Sync URL whenever applied state changes
  useEffect(() => {
    const params = filtersToParams(filters, sort, page, q);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [filters, sort, page, q, pathname, router]);

  /* ── Fetch ──────────────────────────────────────────────── */
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

  /* ── Handlers ───────────────────────────────────────────── */
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

  /* ── Results summary text ───────────────────────────────── */
  function resultsSummary(): string {
    if (!data) return "";
    const { total } = data;
    const cityLabel = filters.city ? ` in ${filters.city}` : "";
    const queryLabel = q ? ` for "${q}"` : "";
    if (total === 0) return `No hostels found${cityLabel}${queryLabel}`;
    return `${total.toLocaleString()} hostel${total === 1 ? "" : "s"}${cityLabel}${queryLabel}`;
  }

  return (
    <div className="container-app py-6">
      <div className="mb-6">
        <h1 className="font-heading text-[length:var(--text-h2)] font-[600] text-[color:var(--color-text-heading)]">
          Find student hostels
        </h1>
        <p className="mt-1 text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
          Compare verified stays by city, monthly price, gender, and amenities.
        </p>
      </div>

      {/* ── Controls row ──────────────────────────────────── */}
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
        <p className="order-3 basis-full text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-heading)] sm:order-none sm:min-w-0 sm:flex-1 sm:basis-auto sm:truncate">
          {isLoading ? "Searching…" : resultsSummary()}
        </p>

        {/* Sort — above results, not in sidebar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Sort results"
              className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-3 text-[length:var(--text-body-sm)] transition-colors duration-[var(--transition-fast)] hover:border-[var(--color-border-strong)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
            >
              <span className="text-[color:var(--color-text-muted)]">Sort:</span>
              <span className="font-[500] text-[color:var(--color-text-body)]">{SORT_LABELS[sort]}</span>
              <ChevronDown size={13} strokeWidth={1.5} className="ml-1 text-[color:var(--color-text-muted)]" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[12rem]">
            <DropdownMenuRadioGroup
              value={sort}
              onValueChange={(value) => handleSortChange(value as SortOption)}
            >
              {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(
                ([value, label]) => (
                  <DropdownMenuRadioItem key={value} value={value}>
                    {label}
                  </DropdownMenuRadioItem>
                )
              )}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Map toggle */}
        <button
          onClick={() => setMapView((v) => !v)}
          className={`hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-[var(--radius-md)] border text-[length:var(--text-body-sm)] font-[500] transition-colors duration-[var(--transition-fast)] ${
            mapView
              ? "border-[var(--color-primary)] bg-[var(--color-primary-faint)] text-[color:var(--color-primary-deep)]"
              : "border-[var(--color-border-default)] bg-[var(--color-bg-card)] text-[color:var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[color:var(--color-text-body)]"
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

      {/* ── Layout: sidebar + content ────────────────────── */}
      <div className="flex gap-6 items-start">
        {/* Desktop filter sidebar */}
        <FilterSidebar
          filters={filters}
          onChange={handleDesktopFilterChange}
          onReset={handleReset}
        />

        {/* Main content */}
        <section className="flex-1 min-w-0" aria-label="Search results">
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
              className={cn(
                "grid gap-5",
                mapView ? "hidden xl:grid xl:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              )}
              aria-busy="true"
              aria-label="Loading results"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}
          {isLoading && mapView && (
            <div className="xl:hidden">
              <PageSpinner label="Loading map results" />
            </div>
          )}

          {/* Results — list, or list + map split view once "Map" is toggled on.
              Below xl, there isn't room for sidebar + list + map together, so
              the map replaces the list instead of sitting beside it. */}
          {!isLoading && data && data.data.length > 0 && (
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
              <div
                className={cn(
                  "grid gap-5",
                  mapView
                    ? "hidden xl:grid xl:flex-1 xl:min-w-0 xl:grid-cols-2"
                    : "flex-1 min-w-0 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                )}
                role="list"
                aria-label={resultsSummary()}
              >
                {data.data.map((hostel) => (
                  <div
                    key={hostel.id}
                    role="listitem"
                    onMouseEnter={() => setHoveredId(hostel.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={cn(
                      "rounded-[var(--radius-lg)] transition-shadow duration-[var(--transition-fast)]",
                      mapView && hoveredId === hostel.id && "ring-2 ring-[var(--color-primary)] ring-offset-2"
                    )}
                  >
                    <HostelCard
                      hostel={hostel}
                      extraActions={
                        <CompareToggle
                          name={hostel.name}
                          isSelected={compareItems.some((i) => i.id === hostel.id)}
                          isDisabled={compareItems.length >= 3 && !compareItems.some((i) => i.id === hostel.id)}
                          onToggle={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleCompare(hostel);
                          }}
                        />
                      }
                    />
                  </div>
                ))}
              </div>

              {mapView && (
                <div className="xl:sticky xl:top-20 xl:w-[420px] 2xl:w-[480px] xl:shrink-0">
                  <SearchMap
                    hostels={data.data}
                    city={filters.city || undefined}
                    hoveredHostelId={hoveredId}
                    onMarkerHover={setHoveredId}
                  />
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && data && data.data.length === 0 && (
            <div className="space-y-4">
              <RecoveryNotice
                tone="warning"
                title="No exact matches yet"
                message="Try clearing filters, widening your price range, or searching a nearby city."
                primaryAction={
                  activeCount > 0 ? (
                    <Button size="sm" onClick={handleReset}>
                      Clear all filters
                    </Button>
                  ) : undefined
                }
              />
              <EmptyState
                icon={Building2}
                heading="No hostels match your filters"
                description="Clear filters or search a nearby area to see more options."
                compact
              />
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </section>
      </div>

      <CompareTray
        items={compareItems}
        onRemove={(id) => setCompareItems((prev) => prev.filter((i) => i.id !== id))}
        onClear={() => setCompareItems([])}
      />
    </div>
  );
}

/* ── Active filter chip ───────────────────────────────────── */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      role="listitem"
      className="inline-flex items-center gap-1.5 h-7 pl-3 pr-2 rounded-[var(--radius-full)] bg-[var(--color-primary-faint)] border border-[var(--color-primary-light)] text-[length:var(--text-caption)] font-[500] text-[color:var(--color-primary-deep)]"
    >
      {label}
      <button
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="flex h-4 w-4 items-center justify-center rounded-[var(--radius-full)] hover:bg-[var(--color-primary-light)] transition-colors duration-[var(--transition-fast)]"
      >
        <span aria-hidden="true" className="text-[10px] leading-none">✕</span>
      </button>
    </span>
  );
}
