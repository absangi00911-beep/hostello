// Path: src/components/landing/HeroSearch.tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { CitySelector } from "@/components/layout/CitySelector";

const POPULAR_CITIES = ["Lahore", "Karachi", "Islamabad", "Peshawar"];

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
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
            placeholder="Hostel name, area, or university..."
            aria-label="Search hostels"
            className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] pl-10 pr-4 text-[var(--text-body-sm)] text-[var(--color-text-body)] placeholder:text-[var(--color-text-placeholder)] transition-all duration-[var(--transition-base)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[oklch(0.62_0.17_65_/_0.15)]"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-inverse)] transition-all duration-[var(--transition-base)] hover:bg-[var(--color-action-dark)] active:bg-[var(--color-action-pressed)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-[var(--color-action-light)] focus-visible:outline-offset-2 whitespace-nowrap"
        >
          <Search size={15} strokeWidth={1.5} aria-hidden="true" />
          Search
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