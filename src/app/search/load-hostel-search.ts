// Path: src/app/search/load-hostel-search.ts
//
// Client-side loading of search results: builds the request, calls the API, validates the
// response and reduces every outcome to one of three results. No React here, so it can be
// tested without a DOM; useHostelSearch.ts only turns the outcome into component state.
import {
  isNearbyCoordinates,
  NEARBY_COORDINATES_SESSION_KEY,
  type NearbyCoordinates,
} from "@/lib/nearby-search";
import { buildSearchParams, type HostelSearchSort } from "./search-params";

export interface HostelSearchResult {
  id: string;
  name: string;
  city: string;
  area: string | null;
  pricePerMonth: number;
  coverImage: string | null;
  images: string[];
  rating: number;
  reviewCount: number;
}

export interface HostelSearchResponse {
  data: HostelSearchResult[];
  total: number;
  error?: string;
}

export const PAGE_SIZE = 20;

export function readNearbyCoordinates(
  fallback: NearbyCoordinates | null = null,
): NearbyCoordinates | null {
  const raw = window.sessionStorage.getItem(NEARBY_COORDINATES_SESSION_KEY);
  if (!raw) return fallback;

  try {
    const coordinates: unknown = JSON.parse(raw);
    return isNearbyCoordinates(coordinates) ? coordinates : fallback;
  } catch {
    return fallback;
  }
}

function isHostelSearchResult(value: unknown): value is HostelSearchResult {
  if (typeof value !== "object" || value === null) return false;
  return (
    "id" in value &&
    typeof value.id === "string" &&
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

function isHostelSearchResponse(value: unknown): value is HostelSearchResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    Array.isArray(value.data) &&
    value.data.every(isHostelSearchResult) &&
    "total" in value &&
    typeof value.total === "number" &&
    Number.isSafeInteger(value.total) &&
    value.total >= value.data.length
  );
}

export interface HostelSearchRequest {
  query: string;
  city: string;
  moveInDate: string;
  checkOutDate: string;
  guests: string;
  nearby: boolean;
  filters: {
    gender: "" | "MALE" | "FEMALE" | "MIXED";
    minPrice: string;
    maxPrice: string;
    amenities: string[];
    verified: boolean;
    sort: HostelSearchSort;
  };
  page: number;
  /** Coordinates passed from the server, used when this tab's session has none stored. */
  initialNearbyCoordinates: NearbyCoordinates | null;
}

export type HostelSearchOutcome =
  | { status: "ok"; hostels: HostelSearchResult[]; total: number }
  | { status: "error"; message: string }
  | { status: "aborted" };

const GENERIC_ERROR = "Unable to load hostels. Please try again.";
const NEARBY_UNAVAILABLE_ERROR =
  "Your nearby location is no longer available in this tab. Start a new search and choose Nearby again.";

/** Load one page of results. Never throws; an aborted request is reported, not an error. */
export async function loadHostelSearch(
  request: HostelSearchRequest,
  signal: AbortSignal,
): Promise<HostelSearchOutcome> {
  const query = buildSearchParams({
    q: request.query,
    city: request.city,
    moveInDate: request.moveInDate,
    checkOut: request.checkOutDate || undefined,
    guests: Number(request.guests),
    gender: request.filters.gender || undefined,
    minPrice: request.filters.minPrice ? Number(request.filters.minPrice) : undefined,
    maxPrice: request.filters.maxPrice ? Number(request.filters.maxPrice) : undefined,
    amenities: request.filters.amenities,
    verified: request.filters.verified,
    sort: request.filters.sort,
    page: request.page,
    limit: PAGE_SIZE,
  });

  try {
    let response: Response;
    if (request.nearby) {
      const coordinates = readNearbyCoordinates(request.initialNearbyCoordinates);
      if (!coordinates) return { status: "error", message: NEARBY_UNAVAILABLE_ERROR };

      const body: {
        latitude: number;
        longitude: number;
        moveInDate?: string;
        checkOut?: string;
        guests?: number;
      } = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      };
      if (request.moveInDate) {
        body.moveInDate = request.moveInDate;
        if (request.checkOutDate) body.checkOut = request.checkOutDate;
        body.guests = Number(request.guests);
      }
      response = await fetch(`/api/hostels/nearby?${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
    } else {
      response = await fetch(`/api/hostels?${query}`, { signal });
    }
    const result: unknown = await response.json();

    if (!response.ok) {
      return {
        status: "error",
        message:
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : GENERIC_ERROR,
      };
    }
    if (!isHostelSearchResponse(result)) return { status: "error", message: GENERIC_ERROR };

    return { status: "ok", hostels: result.data, total: result.total };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return { status: "aborted" };
    return { status: "error", message: GENERIC_ERROR };
  }
}
