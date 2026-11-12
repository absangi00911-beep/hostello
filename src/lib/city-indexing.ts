// Path: src/lib/city-indexing.ts

/** Cities with fewer active hostels than this are thin pages: noindex and out of the sitemap. */
export const MIN_INDEXABLE_CITY_HOSTELS = 3;

export function isCityIndexable(hostelCount: number): boolean {
  return hostelCount >= MIN_INDEXABLE_CITY_HOSTELS;
}
