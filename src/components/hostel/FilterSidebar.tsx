// Path: src/components/hostel/FilterSidebar.tsx
"use client";

import { useState } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { CITIES, AMENITIES } from "@hostello/shared";

export interface FilterState {
  city: string;
  gender: "" | "MALE" | "FEMALE" | "MIXED";
  minPrice: number;
  maxPrice: number;
  amenities: string[];
}

const ALL_AMENITIES = AMENITIES.map((a) => a.label);

const PRICE_MIN = 0;
const PRICE_MAX = 50_000;

interface FilterControlsProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  /** Mobile only — show apply button */
  showApply?: boolean;
  onApply?: () => void;
}

function FilterControls({
  filters,
  onChange,
  onReset,
  showApply,
  onApply,
}: FilterControlsProps) {
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const visibleAmenities = showAllAmenities
    ? ALL_AMENITIES
    : ALL_AMENITIES.slice(0, 12);

  function set<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...filters, [key]: value });
  }

  function toggleAmenity(amenity: string) {
    const next = filters.amenities.includes(amenity)
      ? filters.amenities.filter((a) => a !== amenity)
      : [...filters.amenities, amenity];
    set("amenities", next);
  }

  const inputCls =
    "h-9 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-3 text-[var(--text-body-sm)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-placeholder)] transition-all duration-[var(--transition-base)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[oklch(0.62_0.17_65_/_0.15)]";

  const labelCls =
    "block text-[var(--text-label)] font-[500] text-[var(--color-text-body)] mb-2";

  return (
    <div className="flex flex-col gap-6">
      {/* ── City ──────────────────────────────── */}
      <div>
        <label htmlFor="filter-city" className={labelCls}>
          City
        </label>
        <div className="relative">
          <select
            id="filter-city"
            value={filters.city}
            onChange={(e) => set("city", e.target.value)}
            className={`${inputCls} appearance-none pr-8`}
          >
            <option value="">All cities</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown
            size={14}
            strokeWidth={1.5}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* ── Gender ────────────────────────────── */}
      <fieldset>
        <legend className={labelCls}>Gender</legend>
        <div className="space-y-2">
          {(
            [
              { value: "", label: "All" },
              { value: "MALE", label: "Male only" },
              { value: "FEMALE", label: "Female only" },
              { value: "MIXED", label: "Mixed" },
            ] as const
          ).map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <span
                className={`
                  flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] transition-colors duration-[var(--transition-fast)] shrink-0
                  ${
                    filters.gender === value
                      ? "border-[var(--color-action)] bg-[var(--color-action)]"
                      : "border-[var(--color-border-strong)] bg-[var(--color-bg-card)] group-hover:border-[var(--color-primary)]"
                  }
                `}
              >
                {filters.gender === value && (
                  <span className="h-2 w-2 rounded-full bg-[var(--color-text-inverse)]" aria-hidden="true" />
                )}
              </span>
              <input
                type="radio"
                name="gender"
                value={value}
                checked={filters.gender === value}
                onChange={() => set("gender", value)}
                className="sr-only"
              />
              <span className="text-[var(--text-body-sm)] text-[var(--color-text-body)]">
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* ── Price range ───────────────────────── */}
      <div>
        <p className={labelCls}>Price range (PKR / month)</p>
        <Slider
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={500}
          value={[filters.minPrice, filters.maxPrice]}
          onValueChange={([min, max]) => {
            set("minPrice", min);
            set("maxPrice", max);
          }}
          className="mb-4"
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={filters.minPrice}
            min={PRICE_MIN}
            max={filters.maxPrice - 500}
            step={500}
            onChange={(e) => set("minPrice", Math.max(PRICE_MIN, Number(e.target.value)))}
            aria-label="Minimum price"
            className={`${inputCls} text-center`}
          />
          <span className="text-[var(--color-text-muted)] text-[var(--text-body-sm)] shrink-0">–</span>
          <input
            type="number"
            value={filters.maxPrice}
            min={filters.minPrice + 500}
            max={PRICE_MAX}
            step={500}
            onChange={(e) => set("maxPrice", Math.min(PRICE_MAX, Number(e.target.value)))}
            aria-label="Maximum price"
            className={`${inputCls} text-center`}
          />
        </div>
      </div>

      {/* ── Amenities ─────────────────────────── */}
      <fieldset>
        <legend className={labelCls}>Amenities</legend>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {visibleAmenities.map((amenity) => {
            const checked = filters.amenities.includes(amenity);
            return (
              <label
                key={amenity}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <span
                  className={`
                    flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border-[1.5px] transition-colors duration-[var(--transition-fast)]
                    ${
                      checked
                        ? "border-[var(--color-action)] bg-[var(--color-action)]"
                        : "border-[var(--color-border-strong)] bg-[var(--color-bg-card)] group-hover:border-[var(--color-primary)]"
                    }
                  `}
                >
                  {checked && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAmenity(amenity)}
                  className="sr-only"
                />
                <span className="text-[var(--text-body-sm)] text-[var(--color-text-body)]">
                  {amenity}
                </span>
              </label>
            );
          })}
        </div>

        {ALL_AMENITIES.length > 12 && (
          <button
            onClick={() => setShowAllAmenities((v) => !v)}
            className="mt-2 text-[var(--text-body-sm)] text-[var(--color-text-link)] hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {showAllAmenities
              ? "Show less"
              : `Show ${ALL_AMENITIES.length - 12} more`}
          </button>
        )}
      </fieldset>

      {/* ── Mobile actions ────────────────────── */}
      {showApply && (
        <div className="flex flex-col gap-2 pt-2 border-t border-[var(--color-border-subtle)] sticky bottom-0 bg-[var(--color-bg-card)] pb-2">
          <button
            onClick={onApply}
            className="h-10 w-full rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-inverse)] transition-colors duration-[var(--transition-base)] hover:bg-[var(--color-action-dark)]"
          >
            Apply filters
          </button>
          <button
            onClick={onReset}
            className="h-10 w-full rounded-[var(--radius-md)] text-[var(--text-body-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-body)] transition-colors duration-[var(--transition-fast)]"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* ── Desktop reset ─────────────────────── */}
      {!showApply && (
        <button
          onClick={onReset}
          className="text-left text-[var(--text-body-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-body)] transition-colors duration-[var(--transition-fast)] focus-visible:underline focus-visible:outline-none"
        >
          Reset filters
        </button>
      )}
    </div>
  );
}

/* ── Desktop sidebar ──────────────────────────────────────── */
interface FilterSidebarProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onReset: () => void;
}

export function FilterSidebar({ filters, onChange, onReset }: FilterSidebarProps) {
  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside
        className="hidden lg:block w-[280px] shrink-0"
        aria-label="Search filters"
      >
        <div className="sticky top-20 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5 shadow-[var(--shadow-xs)]">
          <p className="text-[var(--text-h5)] font-[600] text-[var(--color-text-heading)] mb-5"
             style={{ fontFamily: "var(--font-body)" }}>
            Filters
          </p>
          <FilterControls
            filters={filters}
            onChange={onChange}
            onReset={onReset}
          />
        </div>
      </aside>

      {/* Mobile / tablet: sheet trigger button (rendered in parent) */}
    </>
  );
}

/* ── Mobile filter sheet ──────────────────────────────────── */
interface MobileFilterSheetProps {
  filters: FilterState;
  pendingFilters: FilterState;
  onPendingChange: (f: FilterState) => void;
  onApply: () => void;
  onReset: () => void;
  activeCount: number;
}

export function MobileFilterSheet({
  pendingFilters,
  onPendingChange,
  onApply,
  onReset,
  activeCount,
}: MobileFilterSheetProps) {
  const [open, setOpen] = useState(false);

  function handleApply() {
    onApply();
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="lg:hidden inline-flex items-center gap-2 h-9 px-3 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-body)] transition-all duration-[var(--transition-fast)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-overlay)]">
          <SlidersHorizontal size={15} strokeWidth={1.5} aria-hidden="true" />
          Filters
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 text-[10px] font-[600] text-[var(--color-text-heading)]">
              {activeCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="rounded-t-[var(--radius-xl)] bg-[var(--color-bg-card)] border-t border-[var(--color-border-default)] max-h-[90dvh] overflow-y-auto p-5"
      >
        <SheetHeader className="mb-5">
          <SheetTitle
            className="text-[var(--text-h5)] font-[600] text-[var(--color-text-heading)] text-left"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Filters
          </SheetTitle>
        </SheetHeader>
        <FilterControls
          filters={pendingFilters}
          onChange={onPendingChange}
          onReset={onReset}
          showApply
          onApply={handleApply}
        />
      </SheetContent>
    </Sheet>
  );
}