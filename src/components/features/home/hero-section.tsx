"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ArrowRight, CheckCircle2 } from "lucide-react";
import { CITIES } from "@/config/amenities";
import { buildSearchParams } from "@/lib/utils";
import Link from "next/link";

interface HeroSectionProps {
  hostelCount: number;
  studentsHoused: number;
}

function formatStat(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".0", "")}k+`;
  return String(n);
}

export function HeroSection({ hostelCount, studentsHoused }: HeroSectionProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");

  const HOSTEL_DISPLAY_THRESHOLD = 5;
  const STUDENTS_DISPLAY_THRESHOLD = 50;
  const showHostelStat = hostelCount >= HOSTEL_DISPLAY_THRESHOLD;
  const showStudentsStat = studentsHoused >= STUDENTS_DISPLAY_THRESHOLD;

  const HERO_STATS = [
    showHostelStat
      ? { value: String(hostelCount), label: hostelCount === 1 ? "Hostel listed" : "Hostels listed" }
      : { value: "100%", label: "In-person verified" },
    showStudentsStat
      ? { value: formatStat(studentsHoused), label: "Students housed" }
      : { value: "100%", label: "Real reviews only" },
    { value: "8", label: "Cities covered" },
  ];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = buildSearchParams({ q: query, city });
    router.push(`/hostels${params ? `?${params}` : ""}`);
  }

  return (
    <section className="relative bg-[var(--color-ground)] border-b border-[var(--color-border)]">
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        
        {/* Trust Badge */}
        <div className="mb-8 flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-brand-50)] border border-[var(--color-brand-200)]">
            <CheckCircle2 className="w-4 h-4 text-[var(--color-brand-600)]" />
            <span className="text-sm font-semibold text-[var(--color-brand-700)]">
              Every listing verified in-person
            </span>
          </div>
        </div>

        {/* Headline */}
        <h1
          className="text-[clamp(2.5rem,7vw,5rem)] font-extrabold text-[var(--color-ink)] leading-[1.05] tracking-tight max-w-3xl mb-6"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Find your perfect
          <span className="block text-[var(--color-brand-600)]">student hostel</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg text-[var(--color-ink-muted)] max-w-xl leading-relaxed mb-12">
          No fake photos. No scams. No WhatsApp chaos. Just verified listings across Pakistan's top cities.
        </p>

        {/* Search bar — clean, focused, functional */}
        <form onSubmit={handleSearch} className="max-w-2xl mb-12">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 rounded-xl overflow-hidden bg-white border border-[var(--color-border)] shadow-sm hover:shadow-[var(--shadow-card-hover)] transition-shadow">
            {/* Text search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-ink-muted)]" />
              <input
                type="text"
                placeholder="University, area, or hostel name"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-transparent text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] text-base outline-none"
              />
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px bg-[var(--color-border)]" />

            {/* City select */}
            <div className="relative sm:flex-shrink-0">
              <MapPin className="absolute left-4 sm:left-3 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-4 sm:h-4 text-[var(--color-ink-muted)] pointer-events-none" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full sm:w-48 h-12 pl-12 sm:pl-9 pr-4 bg-transparent text-[var(--color-ink)] text-base appearance-none outline-none cursor-pointer font-medium"
              >
                <option value="">All cities</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="h-12 px-6 sm:px-8 bg-[var(--color-brand-500)] text-[var(--color-ink)] text-base font-bold hover:bg-[var(--color-brand-600)] active:scale-95 transition-all flex items-center justify-center gap-2 flex-shrink-0"
            >
              Search
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Quick city links */}
        <div className="mb-12">
          <p className="text-sm font-semibold text-[var(--color-ink-muted)] mb-3">Popular cities:</p>
          <div className="flex gap-2 flex-wrap">
            {["Lahore", "Islamabad", "Karachi"].map((c) => (
              <Link
                key={c}
                href={`/hostels?city=${c}`}
                className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-ink)] text-sm font-medium hover:bg-[var(--color-ground)] hover:border-[var(--color-brand-300)] transition-colors btn-press"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>

        {/* Trust stats */}
        <div className="grid grid-cols-3 gap-6 sm:gap-10 pt-12 border-t border-[var(--color-border)]">
          {HERO_STATS.map((stat) => (
            <div key={stat.label}>
              <p
                className="text-3xl sm:text-4xl font-extrabold text-[var(--color-brand-600)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm text-[var(--color-ink-muted)] mt-2 leading-snug">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}