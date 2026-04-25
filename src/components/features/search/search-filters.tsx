"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { CITIES, AMENITIES, SORT_OPTIONS } from "@/config/amenities";
import { buildSearchParams, cn } from "@/lib/utils";

interface SearchFiltersProps {
  initialParams: Record<string, string | string[]>;
  onClose?: () => void;
}

function getStr(p: Record<string, string | string[]>, k: string) {
  const v = p[k]; return typeof v === "string" ? v : "";
}
function getArr(p: Record<string, string | string[]>, k: string) {
  const v = p[k];
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

const LABEL = "block text-xs font-semibold text-[var(--color-ink-soft)] uppercase tracking-wider mb-2.5";
const SELECT = "w-full h-10 px-3 rounded-xl border border-[var(--color-border)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20 transition-all appearance-none cursor-pointer";
const INPUT  = "w-full h-10 px-3 rounded-xl border border-[var(--color-border)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] outline-none focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-500)]/20 transition-all";

export function SearchFilters({ initialParams, onClose }: SearchFiltersProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const [city,      setCity]      = useState(getStr(initialParams, "city"));
  const [gender,    setGender]    = useState(getStr(initialParams, "gender"));
  const [minPrice,  setMinPrice]  = useState(getStr(initialParams, "minPrice"));
  const [maxPrice,  setMaxPrice]  = useState(getStr(initialParams, "maxPrice"));
  const [amenities, setAmenities] = useState<string[]>(getArr(initialParams, "amenities"));
  const [sort,      setSort]      = useState(getStr(initialParams, "sort"));
  const [verified,  setVerified]  = useState(getStr(initialParams, "verified") === "true");

  const apply = useCallback(() => {
    const qs = buildSearchParams({
      city, gender, minPrice, maxPrice, amenities, sort,
      verified: verified ? "true" : undefined,
      q: getStr(initialParams, "q"),
    });
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
    onClose?.();
  }, [city, gender, minPrice, maxPrice, amenities, sort, verified, initialParams, pathname, router, onClose]);

  function reset() {
    setCity(""); setGender(""); setMinPrice(""); setMaxPrice("");
    setAmenities([]); setSort(""); setVerified(false);
    router.push(pathname);
    onClose?.();
  }

  const hasFilters = city || gender || minPrice || maxPrice || amenities.length || verified;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[var(--color-ink)]">Filters</p>
        {hasFilters && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
          >
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* Sort */}
      <div>
        <label className={LABEL}>Sort by</label>
        <div className="relative">
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={SELECT}>
            <option value="">Relevance</option>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-muted)]" />
        </div>
      </div>

      {/* City */}
      <div>
        <label className={LABEL}>City</label>
        <div className="space-y-1.5">
          {["", ...CITIES].map((c) => (
            <label key={c || "all"} className="flex items-center gap-2.5 cursor-pointer group">
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                  city === c
                    ? "border-[var(--color-brand-500)] bg-[var(--color-brand-500)]"
                    : "border-[var(--color-border)] group-hover:border-[var(--color-brand-500)]"
                )}
              >
                {city === c && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <input type="radio" name="city" value={c} checked={city === c}
                onChange={() => setCity(c)} className="sr-only" />
              <span className="text-sm text-[var(--color-ink-soft)]">
                {c || "All cities"}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div>
        <label className={LABEL}>Who stays here</label>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { v: "",       l: "Any"   },
            { v: "MALE",   l: "Boys"  },
            { v: "FEMALE", l: "Girls" },
            { v: "MIXED",  l: "Mixed" },
          ].map((o) => (
            <button
              key={o.v}
              onClick={() => setGender(o.v)}
              className={cn(
                "py-2 rounded-xl text-xs font-semibold border transition-all",
                gender === o.v
                  ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]"
                  : "bg-white text-[var(--color-muted)] border-[var(--color-border)] hover:border-[var(--color-ink-soft)]"
              )}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <label className={LABEL}>Monthly price (PKR)</label>
        <div className="flex items-center gap-2">
          <input
            type="number" placeholder="Min" value={minPrice} min={0}
            onChange={(e) => setMinPrice(e.target.value)}
            className={INPUT}
          />
          <span className="text-[var(--color-muted)] text-sm flex-shrink-0">–</span>
          <input
            type="number" placeholder="Max" value={maxPrice} min={0}
            onChange={(e) => setMaxPrice(e.target.value)}
            className={INPUT}
          />
        </div>
      </div>

      {/* Verified */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <div
          className={cn(
            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0",
            verified
              ? "bg-[var(--color-brand-500)] border-[var(--color-brand-500)]"
              : "border-[var(--color-border)] group-hover:border-[var(--color-brand-500)]"
          )}
        >
          {verified && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} className="sr-only" />
        <span className="text-sm font-medium text-[var(--color-ink-soft)]">Verified only</span>
      </label>

      {/* Amenities */}
      <div>
        <label className={LABEL}>Amenities</label>
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {AMENITIES.map((a) => {
            const on = amenities.includes(a.id);
            return (
              <label key={a.id} className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  className={cn(
                    "w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0",
                    on
                      ? "bg-[var(--color-brand-500)] border-[var(--color-brand-500)]"
                      : "border-[var(--color-border)] group-hover:border-[var(--color-brand-500)]"
                  )}
                >
                  {on && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                      <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <input type="checkbox" checked={on}
                  onChange={() => setAmenities((p) => on ? p.filter((x) => x !== a.id) : [...p, a.id])}
                  className="sr-only" />
                <span className="text-sm text-[var(--color-ink-soft)]">
                  {a.emoji} {a.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Apply */}
      <button
        onClick={apply}
        className="w-full py-3 rounded-xl bg-[var(--color-ink)] text-white text-sm font-bold hover:bg-[var(--color-ink-soft)] transition-colors"
      >
        Apply filters
        {hasFilters ? ` (${[city, gender, verified ? "v" : "", minPrice, maxPrice, ...amenities].filter(Boolean).length})` : ""}
      </button>
    </div>
  );
}
