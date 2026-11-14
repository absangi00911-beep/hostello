// Path: src/app/search/load-initial-hostel-search.ts
//
// Server side of the search page: answers the first search while rendering, with the same
// query validation and search code as GET /api/hostels. Returns null whenever the browser
// should load results itself, so a problem here can never break the page.
import { parseHostelSearchParams } from "@/lib/hostel-search-params";
import { searchHostelsWithFallback } from "@/lib/hostel-search";
import { fetchHostelSearchResults } from "@/lib/hostel-search-response";
import { createOperationalLogContext, logOperationalEvent } from "@/lib/operational-logger";
import { getSafeErrorSummary } from "@/lib/safe-error";
import {
  buildHostelSearchQuery,
  isHostelSearchResponse,
  type HostelSearchInitialResults,
  type HostelSearchRequest,
} from "./load-hostel-search";

export async function loadInitialHostelSearch(
  request: HostelSearchRequest,
): Promise<HostelSearchInitialResults | null> {
  // "Nearby" depends on coordinates held in the browser tab.
  if (request.nearby) return null;

  try {
    const parsed = parseHostelSearchParams(buildHostelSearchQuery(request));
    // The API would answer with an error message; let the browser request it and show it.
    if (!parsed.ok) return null;

    const { hostelIds, total } = await searchHostelsWithFallback(parsed.search, createOperationalLogContext());
    const results = { data: await fetchHostelSearchResults(hostelIds), total };

    // Only hand the client what it expects to render.
    return isHostelSearchResponse(results) ? { hostels: results.data, total: results.total } : null;
  } catch (error) {
    const summary = getSafeErrorSummary(error);
    logOperationalEvent("warn", "search.initial_results_failed", {
      error_name: summary.name,
      error_code: summary.code ?? null,
    });
    return null;
  }
}
