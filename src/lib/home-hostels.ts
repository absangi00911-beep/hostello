// Path: src/lib/home-hostels.ts
//
// The listings behind the home page's "Stays in <city>" rows. The rows used to be built by
// grouping the 50 newest hostels, so whichever few cities held the most recent listings
// filled the page and every other city (often the biggest markets) was missing. This loads a
// few hostels per city instead, biggest cities first, so each row is guaranteed its share.
import type { Category } from "@/components/home/BrowseCategoryNav";
import { buildHomeListingsQuery } from "@/components/home/home-listings";
import type { HostelListing } from "@/components/home/HostelRow";
import { getCityLinks } from "@/lib/city-links";
import { searchHostelsWithFallback } from "@/lib/hostel-search";
import { parseHostelSearchParams } from "@/lib/hostel-search-params";
import { fetchHostelSearchResults } from "@/lib/hostel-search-response";
import type { OperationalLogContext } from "@/lib/operational-logger";

/** How long the home listings are cached, shared by the page render and the tab route. */
export const HOME_HOSTELS_REVALIDATE_SECONDS = 60;
/** How many city rows the home page shows. */
export const HOME_CITY_ROW_LIMIT = 8;
/** How many hostels each city row gets. */
export const HOME_HOSTELS_PER_CITY = 8;

export interface HomeHostels {
  data: HostelListing[];
  total: number;
}

export async function loadHomeHostelsByCity(
  category: Category,
  logContext?: OperationalLogContext,
): Promise<HomeHostels> {
  const parsed = parseHostelSearchParams(buildHomeListingsQuery(category));
  if (!parsed.ok) throw new Error("The home listing query is not valid.");

  // getCityLinks never throws: with no city list we keep the previous single-query listing.
  const cities = await getCityLinks({ limit: HOME_CITY_ROW_LIMIT });
  if (cities.length === 0) {
    const { hostelIds, total } = await searchHostelsWithFallback(parsed.search, logContext);
    return { data: await fetchHostelSearchResults(hostelIds), total };
  }

  const perCity = await Promise.all(
    cities.map((city) =>
      searchHostelsWithFallback(
        { ...parsed.search, city: city.name, page: 1, limit: HOME_HOSTELS_PER_CITY },
        logContext,
      ),
    ),
  );

  // Keep the cities in their biggest-first order; a hostel can only match one city.
  const hostelIds = [...new Set(perCity.flatMap((result) => result.hostelIds))];
  const total = perCity.reduce((sum, result) => sum + result.total, 0);
  return { data: await fetchHostelSearchResults(hostelIds), total };
}
