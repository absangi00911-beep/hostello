// Path: src/components/landing/HeroSearch.tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { CitySelector } from "@/components/layout/CitySelector";
import { cn } from "@/lib/utils";

const POPULAR_CITIES = ["Lahore", "Karachi", "Islamabad", "Peshawar"];

// Real, backend-supported filters only — these match src/app/api/hostels/route.ts
// and FilterSidebar.tsx's own gender union exactly. No move-in date or duration
// picker here: neither is a field the search API accepts today, and a filter
// that doesn't filter is worse than no filter at all.
const GENDER_OPTIONS = [
  { label: "Any", value: "" },
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Mixed", value: "MIXED" },
] as const;

const BUDGET_OPTIONS = [
  { label: "Any budget", value: "" },
  { label: "Under 20k", value: "20000" },
  { label: "Under 30k", value: "30000" },
  { label: "Under 50k", value: "50000" },
] as const;

function Chip({
  active,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "h-8 shrink-0 rounded-[var(--radius-full)] border px-3 text-[length:var(--text-caption)] font-[500] transition-colors duration-[var(--transition-fast)]",
        active
          ? "border-[var(--color-primary)] bg-[var(--color-primary-faint)] text-[color:var(--color-primary-deep)]"
          : "border-[var(--color-border-default)] bg-[var(--color-bg-card)] text-[color:var(--color-text-muted)] hover:border-[var(--color-border-strong)] hover:text-[color:var(--color-text-heading)]"
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [gender, setGender] = useState<(typeof GENDER_OPTIONS)[number]["value"]>("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (gender) params.set("gender", gender);
    const stored = localStorage.getItem("hostello-city");
    if (stored && stored !== "All cities") params.set("city", stored);
    router.push(`/hostels?${params.toString()}`);
  }

  function goToCity(city: string) {
    router.push(`/hostels?city=${encodeURIComponent(city)}`);
  }

  return (
    <div className="w-full space-y-3">
      {/* City + search — two adjacent pills rather than one fused segment,
          matching the same pattern as the nav's compact search cluster
          (Navbar.tsx) so the two visually read as the same control at two
          sizes. */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
        role="search"
        aria-label="Find a hostel"
      >
        <Suspense fallback={null}>
          <CitySelector />
        </Suspense>

        <div className="flex flex-1 items-center gap-1 rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] py-1.5 pl-4 pr-1.5 transition-shadow duration-[var(--transition-fast)] focus-within:border-[var(--color-primary)] focus-within:ring-[3px] focus-within:ring-[var(--color-primary)]/15">
          <Search
            size={16}
            strokeWidth={1.5}
            className="shrink-0 text-[color:var(--color-text-muted)]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hostel, area, or university..."
            aria-label="Search hostels"
            className="h-8 flex-1 min-w-0 bg-transparent px-2 text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)] placeholder:text-[color:var(--color-text-placeholder)] focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-action)] text-[color:var(--color-text-inverse)] transition-all duration-[var(--transition-base)] hover:bg-[var(--color-action-dark)] active:scale-[0.94]"
          >
            <Search
              size={15}
              strokeWidth={2}
              className="transition-transform duration-[var(--transition-fast)] group-hover:scale-110"
              aria-hidden="true"
            />
          </button>
        </div>
      </form>

      {/* Quick-filter rail — real filters only (gender, budget), both read
          by the same handleSubmit that the pill above submits through. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[length:var(--text-caption)] font-[600] uppercase tracking-[0.06em] text-[color:var(--color-text-muted)]">
          Looking for
        </span>
        {GENDER_OPTIONS.map((option) => (
          <Chip
            key={option.label}
            active={gender === option.value}
            onClick={() => setGender(option.value)}
          >
            {option.label}
          </Chip>
        ))}
        <span className="mx-0.5 h-4 w-px bg-[var(--color-border-default)]" aria-hidden="true" />
        {BUDGET_OPTIONS.map((option) => (
          <Chip
            key={option.label}
            active={maxPrice === option.value}
            onClick={() => setMaxPrice(option.value)}
          >
            {option.label}
          </Chip>
        ))}
      </div>

      {/* Popular cities */}
      <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
        Popular cities:{" "}
        {POPULAR_CITIES.map((city, i) => (
          <span key={city}>
            <button
              onClick={() => goToCity(city)}
              className="text-[color:var(--color-text-link)] hover:underline focus-visible:underline focus-visible:outline-none"
            >
              {city}
            </button>
            {i < POPULAR_CITIES.length - 1 && (
              <span className="mx-1.5 text-[color:var(--color-text-muted)]" aria-hidden="true">·</span>
            )}
          </span>
        ))}
      </p>
    </div>
  );
}