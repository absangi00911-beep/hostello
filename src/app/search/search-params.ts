export type HostelSearchSort = "newest" | "rating" | "price_asc" | "price_desc";

export interface HostelSearchFilterParams {
  q?: string;
  city?: string;
  checkIn?: string;
  moveInDate?: string;
  checkOut?: string;
  guests?: number;
  gender?: "MALE" | "FEMALE" | "MIXED";
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  verified?: boolean;
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
  const q = filters.q?.trim();
  if (q) params.set("q", q);
  const city = filters.city?.trim();
  if (city) params.set("city", city);
  const checkIn = filters.checkIn ?? filters.moveInDate;
  if (checkIn) {
    params.set(filters.checkIn ? "checkIn" : "moveInDate", checkIn);
    if (filters.checkOut) params.set("checkOut", filters.checkOut);
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
  if (filters.verified) params.set("verified", "true");

  return params;
}
