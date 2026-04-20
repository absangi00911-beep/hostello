"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ArrowRight, GraduationCap } from "lucide-react";
import { CITIES } from "@/config/amenities";
import { POPULAR_UNIVERSITIES } from "@/config/universities";
import { buildSearchParams } from "@/lib/utils";
import Link from "next/link";

// These reflect real facts about the platform at launch
const HERO_STATS = [
  { value: "8",        label: "Cities covered" },
  { value: "Verified", label: "Every listing"  },
  { value: "Zero",     label: "Fees for students" },
];

const MARQUEE_CITIES = [
  "Lahore", "Islamabad", "Karachi", "Faisalabad",
  "Multan", "Peshawar", "Rawalpindi", "Quetta",
  "Lahore", "Islamabad", "Karachi", "Faisalabad",
  "Multan", "Peshawar", "Rawalpindi", "Quetta",
];

export function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [city,  setCity]  = useState("");

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
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-[var(--color-ink)]">

      {/* ── Grid overlay ── */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden="true"
      />

      {/* ── Green blob ── */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] pointer-events-none"
        style={{ background: "radial-gradient(circle, #00DC62 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      {/* ── Main content ── */}
      <div className="relative flex-1 flex flex-col justify-center mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pt-28 pb-16">

        {/* Badge */}
        <div style={{ animation: "heroFadeUp 0.5s 0.05s ease both" }}>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-xs font-medium text-white/70 mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-400)]" />
            Pakistan&apos;s first verified hostel marketplace
          </span>
        </div>

        {/* Headline */}
        <h1
          className="text-[clamp(2.8rem,8vw,6rem)] font-extrabold text-white leading-[0.95] tracking-tight max-w-4xl"
          style={{
            fontFamily: "var(--font-display)",
            animation: "heroFadeUp 0.6s 0.1s ease both",
          }}
        >
          Find your
          <span
            className="block"
            style={{
              background: "linear-gradient(135deg, #00DC62 0%, #00f570 50%, #70ffaa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            perfect hostel.
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="mt-6 text-lg sm:text-xl text-white/50 max-w-xl leading-relaxed font-normal"
          style={{ animation: "heroFadeUp 0.6s 0.2s ease both" }}
        >
          Verified listings, real reviews, direct booking.
          No agents. No surprises.
        </p>

        {/* Search form */}
        <form
          onSubmit={handleSearch}
          style={{ animation: "heroFadeUp 0.6s 0.3s ease both" }}
          className="mt-10 flex flex-col sm:flex-row gap-2 max-w-2xl"
        >
          {/* Query input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input
              type="text"
              placeholder="University, area, or hostel name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-14 pl-11 pr-4 rounded-2xl bg-white/8 border border-white/12 text-white placeholder:text-white/30 text-sm outline-none focus:border-[var(--color-brand-500)] focus:bg-white/10 transition-all backdrop-blur-sm"
            />
          </div>

          {/* City select */}
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-14 pl-11 pr-10 rounded-2xl bg-white/8 border border-white/12 text-white text-sm appearance-none outline-none focus:border-[var(--color-brand-500)] transition-all cursor-pointer min-w-40 backdrop-blur-sm"
            >
              <option value="" className="bg-[#0A0A0A]">All cities</option>
              {CITIES.map((c) => (
                <option key={c} value={c} className="bg-[#0A0A0A]">{c}</option>
              ))}
            </select>
          </div>

          {/* Search button */}
          <button
            type="submit"
            className="h-14 px-8 rounded-2xl bg-[var(--color-brand-500)] text-[var(--color-ink)] text-sm font-bold hover:bg-[var(--color-brand-400)] transition-colors whitespace-nowrap flex items-center gap-2"
          >
            Search
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick links — cities */}
        <div
          className="mt-4 flex items-center gap-2 flex-wrap"
          style={{ animation: "heroFadeUp 0.6s 0.36s ease both" }}
        >
          <span className="text-xs text-white/30 mr-1">Cities:</span>
          {["Lahore", "Islamabad", "Karachi"].map((c) => (
            <Link
              key={c}
              href={`/hostels?city=${c}`}
              className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/50 hover:border-[var(--color-brand-500)] hover:text-[var(--color-brand-400)] transition-colors"
            >
              {c}
            </Link>
          ))}
        </div>

        {/* Quick links — universities */}
        <div
          className="mt-2 flex items-center gap-2 flex-wrap"
          style={{ animation: "heroFadeUp 0.6s 0.42s ease both" }}
        >
          <span className="text-xs text-white/30 mr-1 flex items-center gap-1">
            <GraduationCap className="w-3 h-3" /> Near:
          </span>
          {POPULAR_UNIVERSITIES.map((u) => (
            <button
              key={u.shortName}
              type="button"
              onClick={() => handleUniversityClick(u.shortName, u.city)}
              className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/50 hover:border-[var(--color-brand-500)] hover:text-[var(--color-brand-400)] transition-colors cursor-pointer"
            >
              {u.shortName}
            </button>
          ))}
        </div>

        {/* Stats row */}
        <div
          className="mt-14 flex items-center gap-10"
          style={{ animation: "heroFadeUp 0.6s 0.48s ease both" }}
        >
          {HERO_STATS.map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-10">
              <div>
                <p
                  className="text-3xl font-extrabold text-white leading-none"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-white/40 mt-1">{stat.label}</p>
              </div>
              {i < HERO_STATS.length - 1 && (
                <div className="w-px h-8 bg-white/10" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Marquee strip ── */}
      <div
        className="relative border-t border-white/8 py-4 overflow-hidden"
        style={{ animation: "heroFadeUp 0.5s 0.55s ease both" }}
        aria-hidden="true"
      >
        <div className="flex animate-marquee whitespace-nowrap gap-0">
          {MARQUEE_CITIES.map((city, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-3 px-6 text-xs font-semibold tracking-widest text-white/20 uppercase"
            >
              {city}
              <span className="w-1 h-1 rounded-full bg-[var(--color-brand-500)] flex-shrink-0" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}