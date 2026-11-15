// Path: src/components/home/home-listings.ts
//
// Shared by the home page's server code and ProductHome (a client component): the listing
// response check and the query for each category tab. No "use client", so server code can
// import it.
import type { Category } from "./BrowseCategoryNav";
import type { HostelListing } from "./HostelRow";

/** The tab selected when the page opens: the listing the server renders. */
export const INITIAL_HOME_CATEGORY: Category = "all";

/** The listing request for a category tab. The server and the browser use this same builder. */
export function buildHomeListingsQuery(category: Category): URLSearchParams {
  const params = new URLSearchParams({
    sort: category === "top-rated" ? "rating" : "newest",
    page: "1",
    limit: "50",
  });
  if (category === "women") params.set("gender", "FEMALE");
  if (category === "budget") params.set("maxPrice", "20000");
  return params;
}

export interface HostelSearchResponse {
  data: HostelListing[];
  total: number;
  error?: string;
}

export function isHostelListing(value: unknown): value is HostelListing {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "slug" in value &&
    typeof value.slug === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "city" in value &&
    typeof value.city === "string" &&
    "area" in value &&
    (typeof value.area === "string" || value.area === null) &&
    "pricePerMonth" in value &&
    typeof value.pricePerMonth === "number" &&
    "coverImage" in value &&
    (typeof value.coverImage === "string" || value.coverImage === null) &&
    "images" in value &&
    Array.isArray(value.images) &&
    value.images.every((image: unknown) => typeof image === "string") &&
    "rating" in value &&
    typeof value.rating === "number" &&
    "reviewCount" in value &&
    typeof value.reviewCount === "number"
  );
}

export function isHostelSearchResponse(value: unknown): value is HostelSearchResponse {
  if (
    typeof value !== "object" ||
    value === null ||
    !("data" in value) ||
    !("total" in value)
  ) {
    return false;
  }

  return (
    Array.isArray(value.data) &&
    typeof value.total === "number" &&
    Number.isSafeInteger(value.total) &&
    value.total >= value.data.length &&
    value.data.every(isHostelListing)
  );
}
