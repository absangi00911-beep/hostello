// Path: src/app/load-initial-home-hostels.ts
//
// Server side of the home page: the listings for the opening tab, rendered into the HTML.
// Runs the same validation and search code as GET /api/hostels. Returns null, so the browser
// loads the listings as before, whenever anything goes wrong; it never breaks the page.
import { unstable_cache } from "next/cache";
import {
  buildHomeListingsQuery,
  INITIAL_HOME_CATEGORY,
  isHostelSearchResponse,
} from "@/components/home/home-listings";
import type { HostelListing } from "@/components/home/HostelRow";
import { searchHostelsWithFallback } from "@/lib/hostel-search";
import { parseHostelSearchParams } from "@/lib/hostel-search-params";
import { fetchHostelSearchResults } from "@/lib/hostel-search-response";
import { createOperationalLogContext, logOperationalEvent } from "@/lib/operational-logger";
import { getSafeErrorSummary } from "@/lib/safe-error";

export const HOME_HOSTELS_REVALIDATE_SECONDS = 60;

async function loadHomeHostels(): Promise<HostelListing[]> {
  const parsed = parseHostelSearchParams(buildHomeListingsQuery(INITIAL_HOME_CATEGORY));
  if (!parsed.ok) throw new Error("The home listing query is not valid.");

  const { hostelIds, total } = await searchHostelsWithFallback(parsed.search, createOperationalLogContext());
  const response = { data: await fetchHostelSearchResults(hostelIds), total };
  if (!isHostelSearchResponse(response)) throw new Error("Home listings are not in the expected shape.");
  return response.data;
}

// Every visitor gets the same opening listing, and the home page is the busiest page, so it
// is cached briefly instead of querying once per visit. A failed load throws and is not cached.
const getCachedHomeHostels = unstable_cache(loadHomeHostels, ["home-initial-hostels"], {
  revalidate: HOME_HOSTELS_REVALIDATE_SECONDS,
  tags: ["home-hostels"],
});

export async function loadInitialHomeHostels(): Promise<HostelListing[] | null> {
  try {
    return await getCachedHomeHostels();
  } catch (error) {
    const summary = getSafeErrorSummary(error);
    logOperationalEvent("warn", "home.initial_listings_failed", {
      error_name: summary.name,
      error_code: summary.code ?? null,
    });
    return null;
  }
}
