export type HostelSearchSort = "newest" | "rating" | "price_asc" | "price_desc";

export interface HostelSearchFilterParams {
  city?: string;
  moveInDate?: string;
  guests?: number;
  gender?: "MALE" | "FEMALE" | "MIXED";
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  sort?: HostelSearchSort;
  page: number;
  limit: number;
}

export function buildSearchParams(
  filters: HostelSearchFilterParams,
): URLSearchParams {
  const params = new URLSearchParams({
    sort: filters.sort ?? "newest",
    page: String(filters.page),
    limit: String(filters.limit),
  });
  const city = filters.city?.trim();
  if (city) params.set("city", city);
  if (filters.moveInDate) {
    params.set("moveInDate", filters.moveInDate);
    params.set("guests", String(filters.guests ?? 1));
  }
  if (filters.gender) params.set("gender", filters.gender);
  if (filters.minPrice !== undefined) {
    params.set("minPrice", String(filters.minPrice));
  }
  if (filters.maxPrice !== undefined) {
    params.set("maxPrice", String(filters.maxPrice));
  }
  for (const amenity of filters.amenities ?? []) {
    params.append("amenities", amenity);
  }

  return params;
}
