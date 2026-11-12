import Link from "next/link";
import type { CityLink } from "@/lib/city-links";
import { getCityCanonicalPath } from "@/lib/city-pages";

const chipClassName =
  "inline-flex min-h-11 items-center gap-1 rounded-full border border-line bg-white px-4 text-base font-semibold text-ink no-underline hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2";

/** Crawlable links to the city landing pages. Renders nothing when there are none. */
export function CityLinks({
  cities,
  heading = "Browse student hostels by city",
}: {
  cities: readonly CityLink[];
  heading?: string;
}) {
  if (cities.length === 0) return null;

  return (
    <nav aria-label={heading} className="py-8">
      <h2 className="m-0 text-lg font-semibold text-ink">{heading}</h2>
      <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
        {cities.map((city) => (
          <li key={city.slug}>
            <Link className={chipClassName} href={getCityCanonicalPath(city.slug)}>
              Hostels in {city.name}
              <span className="font-normal text-muted">({city.hostelCount})</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
