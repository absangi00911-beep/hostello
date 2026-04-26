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
  if (stats.length === 0) return null;

  const [first, second, ...rest] = stats;

  return (
    <section className="py-24 bg-[var(--color-ground)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold tracking-widest text-[var(--color-brand-700)] uppercase mb-3">
              Browse by city
            </p>
            <h2
              className="text-4xl sm:text-5xl font-extrabold text-[var(--color-ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Where do you study?
            </h2>
          </div>
          <Link
            href="/hostels"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink)] hover:text-[var(--color-brand-700)] transition-colors"
          >
            All cities <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 grid-rows-2 gap-3 h-auto lg:h-[520px]">

          {/* Featured city — large */}
          {first && (
            <Link
              href={first.count > 0 ? `/hostels?city=${first.city}` : "/hostels"}
              className="group col-span-2 row-span-2 relative overflow-hidden rounded-3xl bg-[var(--color-ink)]"
            >
              {CITY_IMAGES[first.city] && (
                <Image
                  src={CITY_IMAGES[first.city]}
                  alt={first.city}
                  fill
                  sizes="(max-width: 1024px) 50vw, 33vw"
                  priority
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-8">
                <span className="inline-block mb-3 text-xs font-bold tracking-widest text-[var(--color-brand-400)] uppercase">
                  {first.count > 0 ? `${first.count} hostels` : "Coming soon"}
                </span>
                <p
                  className="text-4xl font-extrabold text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {first.city}
                </p>
                <div className="mt-4 flex items-center gap-2 text-white/60 text-sm font-medium group-hover:text-[var(--color-brand-400)] transition-colors">
                  Browse hostels <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          )}

          {/* Second featured city */}
          {second && (
            <Link
              href={second.count > 0 ? `/hostels?city=${second.city}` : "/hostels"}
              className="group col-span-2 row-span-1 relative overflow-hidden rounded-3xl bg-[var(--color-ink)] min-h-[160px]"
            >
              {CITY_IMAGES[second.city] && (
                <Image
                  src={CITY_IMAGES[second.city]}
                  alt={second.city}
                  fill
                  sizes="(max-width: 1024px) 50vw, 50vw"
                  className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-35 group-hover:scale-105 transition-all duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
              <div className="absolute inset-0 flex items-end p-6">
                <div>
                  <span className="text-xs font-bold tracking-widest text-[var(--color-brand-400)] uppercase block mb-1">
                    {second.count > 0 ? `${second.count} hostels` : "Coming soon"}
                  </span>
                  <p
                    className="text-2xl font-extrabold text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {second.city}
                  </p>
                </div>
              </div>
            </Link>
          )}

          {/* Remaining cities — small tiles */}
          {rest.slice(0, 2).map(({ city, count }) => (
            <Link
              key={city}
              href={count > 0 ? `/hostels?city=${city}` : "/hostels"}
              className="group relative overflow-hidden rounded-3xl bg-[var(--color-ink)] min-h-[160px]"
            >
              {CITY_IMAGES[city] && (
                <Image
                  src={CITY_IMAGES[city]}
                  alt={city}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:opacity-30 group-hover:scale-105 transition-all duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-4">
                <p
                  className="text-lg font-extrabold text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {city}
                </p>
                <p className="text-xs text-white/50 mt-0.5">
                  {count > 0 ? `${count} hostel${count !== 1 ? "s" : ""}` : "Soon"}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile view all */}
        <div className="mt-5 sm:hidden">
          <Link
            href="/hostels"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors"
          >
            View all cities <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
