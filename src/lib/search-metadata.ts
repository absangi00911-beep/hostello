// Path: src/lib/search-metadata.ts
import type { Metadata } from "next";

type SearchParamValue = string | string[] | undefined;

const SEARCH_TITLE = "Search student hostels";
const SEARCH_DESCRIPTION =
  "Search student hostels across Pakistan by city, price, gender and facilities, then book online.";

/** True when any filter, query or page parameter carries a value. */
export function hasSearchRefinements(params: Record<string, SearchParamValue>): boolean {
  return Object.values(params).some((value) =>
    Array.isArray(value) ? value.some((item) => item.trim() !== "") : (value ?? "").trim() !== "",
  );
}

/**
 * Plain /search is one indexable page. Every filtered or paged URL is a near-duplicate
 * of it (and of the city pages), so those stay out of the index but still pass links on.
 */
export function buildSearchMetadata(params: Record<string, SearchParamValue>): Metadata {
  if (hasSearchRefinements(params)) {
    return {
      title: SEARCH_TITLE,
      description: SEARCH_DESCRIPTION,
      robots: { index: false, follow: true },
    };
  }
  return {
    title: SEARCH_TITLE,
    description: SEARCH_DESCRIPTION,
    alternates: { canonical: "/search" },
  };
}
