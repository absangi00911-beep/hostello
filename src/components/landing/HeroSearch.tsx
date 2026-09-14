// Path: src/components/landing/HeroSearch.tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import { CitySelector } from "@/components/layout/CitySelector";

const POPULAR_CITIES = ["Lahore", "Karachi", "Islamabad", "Peshawar"];
const BUDGET_OPTIONS = [
  { label: "Any budget", value: "" },
  { label: "Under PKR 20,000", value: "20000" },
  { label: "Under PKR 30,000", value: "30000" },
  { label: "Under PKR 50,000", value: "50000" },
] as const;

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (maxPrice) params.set("maxPrice", maxPrice);
    const stored = localStorage.getItem("hostello-city");
    if (stored && stored !== "All cities") params.set("city", stored);
    router.push(`/hostels?${params.toString()}`);
  }

  function goToCity(city: string) {
    router.push(`/hostels?city=${encodeURIComponent(city)}`);
  }

  return (
    <div className="w-full space-y-4">
      {/* Search form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-2"
        role="search"
        aria-label="Find a hostel"
      >
        {/* City selector */}
        <Suspense fallback={null}>
          <CitySelector />
        </Suspense>

        {/* Query input */}
        <div className="relative flex-1">
          <Search
            size={16}
            strokeWidth={1.5}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hostel, area, or university..."
            aria-label="Search hostels"
            className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] pl-10 pr-4 text-[var(--text-body-sm)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-placeholder)] transition-all duration-[var(--transition-base)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/15"
          />
        </div>

        <label className="relative block sm:w-[170px]">
          <span className="sr-only">Monthly budget</span>
          <select
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            aria-label="Monthly budget"
            className="h-10 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-3 pr-8 text-[var(--text-body-sm)] text-[var(--color-text-body)] transition-all duration-[var(--transition-base)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-[3px] focus:ring-[var(--color-primary)]/15"
          >
            {BUDGET_OPTIONS.map((option) => (
              <option key={option.value || "any"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={15}
            strokeWidth={1.5}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            aria-hidden="true"
          />
        </label>

        {/* Submit */}
        <button
          type="submit"
          className="group inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[600] text-[var(--color-text-inverse)] transition-all duration-[var(--transition-base)] hover:bg-[var(--color-action-dark)] active:bg-[var(--color-action-pressed)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-[var(--color-action-light)] focus-visible:outline-offset-2 whitespace-nowrap"
        >
          <Search size={15} strokeWidth={1.5} className="transition-transform duration-[var(--transition-fast)] group-hover:scale-110" aria-hidden="true" />
          Find hostels
        </button>
      </form>

      {/* Popular cities */}
      <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
        Popular cities:{" "}
        {POPULAR_CITIES.map((city, i) => (
          <span key={city}>
            <button
              onClick={() => goToCity(city)}
              className="text-[var(--color-text-link)] hover:underline focus-visible:underline focus-visible:outline-none"
            >
              {city}
            </button>
            {i < POPULAR_CITIES.length - 1 && (
              <span className="mx-1.5 text-[var(--color-text-muted)]" aria-hidden="true">·</span>
            )}
          </span>
        ))}
      </p>
    </div>
  );
}
