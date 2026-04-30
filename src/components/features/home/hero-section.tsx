"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ArrowRight, GraduationCap } from "lucide-react";
import { CITIES } from "@/config/amenities";
import { POPULAR_UNIVERSITIES } from "@/config/universities";
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
  const [city,  setCity]  = useState("");

  // Only show counts that are high enough to function as proof, not warnings.
  const HOSTEL_DISPLAY_THRESHOLD = 5;
  const STUDENTS_DISPLAY_THRESHOLD = 50;
  const showHostelStat   = hostelCount   >= HOSTEL_DISPLAY_THRESHOLD;
  const showStudentsStat = studentsHoused >= STUDENTS_DISPLAY_THRESHOLD;

  const HERO_STATS = [
    showHostelStat
      ? { value: String(hostelCount), label: hostelCount === 1 ? "Hostel listed" : "Hostels listed" }
      : { value: "In-person", label: "Verified listings" },
    showStudentsStat
      ? { value: formatStat(studentsHoused), label: "Students housed" }
      : { value: "100%", label: "Honest reviews only" },
    { value: "8", label: "Cities covered" },
  ];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = buildSearchParams({ q: query, city });
    router.push(`/hostels${params ? `?${params}` : ""}`);
  }

  function handleUniversityClick(shortName: string, uniCity: string) {
    const params = buildSearchParams({ q: shortName, city: uniCity });
    router.push(`/hostels?${params}`);
  }

  return (
    <section className="relative bg-[var(--color-ground)] border-b border-[var(--color-border)]">
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pt-32 pb-20">

        {/* Badge */}
        <div style={{ animation: "heroFadeUp 0.4s 0.05s ease both" }}>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-muted)] mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)]" />
            Pakistan&apos;s first verified hostel marketplace
          </span>
        </div>

        {/* Headline — plain dark, no gradient, no stroke */}
        <h1
          className="text-[clamp(2.4rem,6vw,5rem)] font-extrabold text-[var(--color-ink)] leading-[0.95] tracking-tight max-w-3xl mb-5"
          style={{
            fontFamily: "var(--font-display)",
            animation: "heroFadeUp 0.5s 0.1s ease both",
          }}
        >
          The only hostel search
          <span className="block">that checks listings in person.</span>
        </h1>

        {/* Subheadline — names the actual anxiety */}
        <p
          className="text-base sm:text-lg text-[var(--color-ink-muted)] max-w-xl leading-relaxed mb-10"
          style={{ animation: "heroFadeUp 0.5s 0.18s ease both" }}
        >
          Every listing is visited by our team before it goes live.
          No fake photos. No WhatsApp back-and-forth with unknown agents.
        </p>

        {/* ── Search bar — visually dominant on light background ── */}
        <form
          onSubmit={handleSearch}
          style={{ animation: "heroFadeUp 0.5s 0.26s ease both" }}
          className="max-w-2xl mb-5"
        >
          <div className="flex flex-col sm:flex-row rounded-2xl overflow-hidden bg-[var(--color-ink)] shadow-[0_4px_24px_rgba(0,0,0,0.18)]">

            {/* Text search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              <input
                type="text"
                placeholder="University, area, or hostel name…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-14 pl-11 pr-4 bg-transparent text-white placeholder:text-white/35 text-sm outline-none"
              />
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px bg-white/10 my-3 flex-shrink-0" aria-hidden="true" />
            <div className="block sm:hidden h-px bg-white/10 mx-4 flex-shrink-0" aria-hidden="true" />

            {/* City select */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full sm:w-auto h-14 pl-9 pr-8 bg-transparent text-white text-sm appearance-none outline-none cursor-pointer sm:min-w-36"
              >
                <option value="" className="bg-[#0A0A0A]">All cities</option>
                {CITIES.map((c) => (
                  <option key={c} value={c} className="bg-[#0A0A0A]">{c}</option>
                ))}
              </select>
            </div>

            {/* Submit — brand green is the only accent in this hero */}
            <button
              type="submit"
              className="h-14 px-7 bg-[var(--color-brand-500)] text-[var(--color-ink)] text-sm font-bold hover:bg-[var(--color-brand-400)] transition-colors whitespace-nowrap flex items-center justify-center gap-2 flex-shrink-0"
            >
              Search
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* City quick links */}
        <div
          className="flex items-center gap-2 flex-wrap mb-2"
          style={{ animation: "heroFadeUp 0.5s 0.32s ease both" }}
        >
          <span className="text-xs text-[var(--color-muted)] mr-1">Cities:</span>
          {["Lahore", "Islamabad", "Karachi"].map((c) => (
            <Link
              key={c}
              href={`/hostels?city=${c}`}
              className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-muted)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] transition-colors"
            >
              {c}
            </Link>
          ))}
        </div>

        {/* University quick links */}
        <div
          className="flex items-center gap-2 flex-wrap mb-12"
          style={{ animation: "heroFadeUp 0.5s 0.36s ease both" }}
        >
          <span className="text-xs text-[var(--color-muted)] mr-1 flex items-center gap-1">
            <GraduationCap className="w-3 h-3" /> Near:
          </span>
          {POPULAR_UNIVERSITIES.map((u) => (
            <button
              key={u.shortName}
              type="button"
              onClick={() => handleUniversityClick(u.shortName, u.city)}
              className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-muted)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] transition-colors cursor-pointer"
            >
              {u.shortName}
            </button>
          ))}
        </div>

        {/* Stats row */}
        <div
          className="flex items-center gap-10 pt-8 border-t border-[var(--color-border)]"
          style={{ animation: "heroFadeUp 0.5s 0.42s ease both" }}
        >
          {HERO_STATS.map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-10">
              <div>
                <p
                  className="text-2xl font-extrabold text-[var(--color-ink)] leading-none"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-[var(--color-muted)] mt-1">{stat.label}</p>
              </div>
              {i < HERO_STATS.length - 1 && (
                <div className="w-px h-7 bg-[var(--color-border)]" />
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}