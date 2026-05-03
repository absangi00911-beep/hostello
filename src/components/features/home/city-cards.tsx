import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface CityStats {
  city: string;
  count: number;
}

const CITY_IMAGES: Record<string, string> = {
  Lahore:     "https://images.unsplash.com/photo-1582487897066-fd3c0fef7b9a?w=800&q=80",
  Islamabad:  "https://images.unsplash.com/photo-1599413987323-b2b9fe8a4db0?w=800&q=80",
  Karachi:    "https://images.unsplash.com/photo-1542744173-05336fcc7ad4?w=800&q=80",
  Faisalabad: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&q=80",
  Multan:     "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80",
  Peshawar:   "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  Rawalpindi: "https://images.unsplash.com/photo-1599413987323-b2b9fe8a4db0?w=800&q=80",
  Quetta:     "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&q=80",
};

export function CityCards({ stats }: { stats: CityStats[] }) {
  const activeCities = stats.filter((s) => s.count > 0);

  if (activeCities.length === 0) return null;

  const [first, second, ...rest] = activeCities;

  return (
    <section className="py-24 sm:py-32 bg-[var(--color-surface)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-14">
          <p className="text-sm font-bold tracking-widest text-[var(--color-brand-600)] uppercase mb-3">
            Browse by Location
          </p>
          <div className="flex items-end justify-between">
            <h2
              className="text-4xl sm:text-5xl font-extrabold text-[var(--color-ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Where do you study?
            </h2>
            <Link
              href="/hostels"
              className="hidden sm:flex items-center gap-2 text-base font-semibold text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] transition-colors"
            >
              View all cities
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 grid-rows-2 gap-4 h-auto lg:h-[520px]">
          
          {/* Featured city — large */}
          {first && (
            <Link
              href={`/hostels?city=${first.city}`}
              className="group col-span-2 row-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-brand-800)]"
            >
              {CITY_IMAGES[first.city] && (
                <Image
                  src={CITY_IMAGES[first.city]}
                  alt={first.city}
                  fill
                  sizes="(max-width: 1024px) 50vw, 33vw"
                  priority
                  className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-35 group-hover:scale-105 transition-all duration-300"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#000]/80 via-[#000]/20 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-start justify-end p-8">
                <p className="text-sm font-bold text-[var(--color-brand-200)] tracking-wide uppercase mb-2">
                  {first.count} hostel{first.count !== 1 ? "s" : ""}
                </p>
                <h3
                  className="text-5xl font-extrabold text-white leading-none mb-4"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {first.city}
                </h3>
                <div className="flex items-center gap-2 text-white/80 group-hover:text-[var(--color-brand-300)] transition-colors">
                  <span className="text-sm font-medium">Browse hostels</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          )}

          {/* Second featured city */}
          {second && (
            <Link
              href={`/hostels?city=${second.city}`}
              className="group col-span-2 row-span-1 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--color-accent-600)] to-[var(--color-accent-500)]"
            >
              {CITY_IMAGES[second.city] && (
                <Image
                  src={CITY_IMAGES[second.city]}
                  alt={second.city}
                  fill
                  sizes="(max-width: 1024px) 50vw, 50vw"
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-25 group-hover:scale-105 transition-all duration-300"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-[#000]/70 via-[#000]/30 to-transparent" />
              <div className="absolute inset-0 flex items-end p-6">
                <div>
                  <p className="text-xs font-bold text-[var(--color-accent-200)] tracking-wide uppercase mb-2">
                    {second.count} hostel{second.count !== 1 ? "s" : ""}
                  </p>
                  <h3
                    className="text-3xl font-extrabold text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {second.city}
                  </h3>
                </div>
              </div>
            </Link>
          )}

          {/* Remaining cities — small tiles */}
          {rest.slice(0, 2).map(({ city, count }) => (
            <Link
              key={city}
              href={`/hostels?city=${city}`}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--color-ink)] to-[#0A0A0A]"
            >
              {CITY_IMAGES[city] && (
                <Image
                  src={CITY_IMAGES[city]}
                  alt={city}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:opacity-30 group-hover:scale-105 transition-all duration-300"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#000]/80 to-transparent" />
              <div className="absolute inset-0 flex items-end p-6">
                <div>
                  <h3
                    className="text-2xl font-extrabold text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {city}
                  </h3>
                  <p className="text-xs text-white/60 mt-1">
                    {count} hostel{count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile view all */}
        <div className="mt-8 sm:hidden">
          <Link
            href="/hostels"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-[var(--color-border)] text-base font-semibold text-[var(--color-ink)] hover:bg-[var(--color-ground)] transition-colors btn-press"
          >
            View all cities
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}