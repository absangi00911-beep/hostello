// Path: src/lib/city-links.ts
import { unstable_cache } from "next/cache";
import { getCitySummaries } from "@/lib/city-pages";
import { logOperationalEvent } from "@/lib/operational-logger";
import { getSafeErrorSummary } from "@/lib/safe-error";

export interface CityLink {
  slug: string;
  name: string;
  hostelCount: number;
}

export const DEFAULT_CITY_LINK_LIMIT = 12;
const CITY_LINKS_REVALIDATE_SECONDS = 3600;

// Shared by the home and hostel pages, which render on every request: cache the
// grouped query for an hour so it does not run once per visitor. A failed query
// throws, and unstable_cache does not store failures.
const getCachedCitySummaries = unstable_cache(getCitySummaries, ["city-link-summaries"], {
  revalidate: CITY_LINKS_REVALIDATE_SECONDS,
  tags: ["city-summaries"],
});

/** Pure: biggest cities first, with `prioritySlug` (the current page's city) leading. */
export function selectCityLinks(
  summaries: readonly CityLink[],
  limit = DEFAULT_CITY_LINK_LIMIT,
  prioritySlug?: string,
): CityLink[] {
  const links = summaries.map(({ slug, name, hostelCount }) => ({ slug, name, hostelCount }));
  const priority = links.find((link) => link.slug === prioritySlug);
  const rest = links.filter((link) => link !== priority);
  return (priority ? [priority, ...rest] : rest).slice(0, Math.max(0, limit));
}

/** Never throws: a links section is optional and must not break the page that hosts it. */
export async function getCityLinks(options: { limit?: number; prioritySlug?: string } = {}): Promise<CityLink[]> {
  try {
    return selectCityLinks(await getCachedCitySummaries(), options.limit, options.prioritySlug);
  } catch (error) {
    const summary = getSafeErrorSummary(error);
    logOperationalEvent("warn", "city_links.query_failed", {
      error_name: summary.name,
      error_code: summary.code ?? null,
    });
    return [];
  }
}
