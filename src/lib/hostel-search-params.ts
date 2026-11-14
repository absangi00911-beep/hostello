// Path: src/lib/hostel-search-params.ts
//
// Parsing and validation of hostel search query parameters. Shared by GET /api/hostels and
// the server-rendered search page, so both accept and reject exactly the same searches.
import { parsePagination } from "@/lib/pagination";

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;
const MAX_SEARCH_LENGTH = 200;
const MAX_CITY_LENGTH = 100;
const MAX_AMENITY_FILTERS = 30;
const MAX_AMENITY_LENGTH = 100;
const MAX_SEARCH_GUESTS = 8;

export type HostelSearchSortKey = "newest" | "rating" | "price_asc" | "price_desc";

export interface ParsedHostelSearch {
  q?: string;
  city?: string;
  gender?: "MALE" | "FEMALE" | "MIXED";
  verified?: true;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  moveInDate?: Date;
  checkOut?: Date;
  guests?: number;
  sort: HostelSearchSortKey;
  page: number;
  limit: number;
}

export type HostelSearchParseResult =
  | { ok: true; search: ParsedHostelSearch }
  | { ok: false; error: string; status: 400 };

export function parseHostelSearchParams(params: URLSearchParams): HostelSearchParseResult {
  const q      = params.get("q") ?? undefined;
  const city   = params.get("city") ?? undefined;
  const verifiedValues = params.getAll("verified");
  const verifiedValue = verifiedValues[0];
  const verified = verifiedValue === "true" ? true : undefined;
  const genderParam = params.get("gender");
  const gender = genderParam === "MALE" || genderParam === "FEMALE" || genderParam === "MIXED" ? genderParam : undefined;
  const minPrice = params.has("minPrice") ? Number(params.get("minPrice")) : undefined;
  const maxPrice = params.has("maxPrice") ? Number(params.get("maxPrice")) : undefined;
  const amenities = params.getAll("amenities");
  const checkInValues = params.getAll("checkIn");
  const checkInValue = checkInValues[0];
  const checkOutValues = params.getAll("checkOut");
  const moveInDateValues = params.getAll("moveInDate");
  const guestsValues = params.getAll("guests");
  const sortParam = params.get("sort");
  const sort = sortParam === "price_asc" || sortParam === "price_desc" || sortParam === "rating" || sortParam === "newest"
    ? sortParam
    : "newest";
  const { page, limit } = parsePagination(params, { defaultLimit: DEFAULT_LIMIT, maxLimit: MAX_LIMIT });

  if (
    (q !== undefined && q.length > MAX_SEARCH_LENGTH) ||
    (city !== undefined && city.length > MAX_CITY_LENGTH) ||
    verifiedValues.length > 1 ||
    (verifiedValue !== undefined && verifiedValue !== "true") ||
    amenities.length > MAX_AMENITY_FILTERS ||
    amenities.some((amenity) => amenity.length > MAX_AMENITY_LENGTH)
  ) {
    return { ok: false, error: "One or more search filters are too long.", status: 400 };
  }
  const moveInDateValue = checkInValue ?? moveInDateValues[0];
  const guestsValue = guestsValues[0];
  const moveInDate = moveInDateValue
    ? new Date(`${moveInDateValue}T00:00:00.000Z`)
    : undefined;
  const checkOutValue = checkOutValues[0];
  const checkOut = checkOutValue
    ? new Date(`${checkOutValue}T00:00:00.000Z`)
    : undefined;
  const guests = guestsValue ? Number(guestsValue) : undefined;
  if (
    checkInValues.length > 1 ||
    checkOutValues.length > 1 ||
    (checkInValue !== undefined && moveInDateValues.length > 0) ||
    moveInDateValues.length > 1 ||
    guestsValues.length > 1 ||
    (checkInValue !== undefined && checkOutValue === undefined) ||
    (moveInDateValue !== undefined &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(moveInDateValue) ||
        Number.isNaN(moveInDate?.getTime()) ||
        moveInDate?.toISOString().slice(0, 10) !== moveInDateValue)) ||
    (checkOutValue !== undefined &&
      (!moveInDate ||
        !checkOut ||
        !/^\d{4}-\d{2}-\d{2}$/.test(checkOutValue) ||
        Number.isNaN(checkOut?.getTime()) ||
        checkOut?.toISOString().slice(0, 10) !== checkOutValue ||
        checkOut <= moveInDate)) ||
    (guestsValue !== undefined &&
      (!moveInDate ||
        guests === undefined ||
        !Number.isInteger(guests) ||
        guests < 1 ||
        guests > MAX_SEARCH_GUESTS))
  ) {
    return { ok: false, error: "Move-in date or guest count is invalid.", status: 400 };
  }
  if (
    (minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) ||
    (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0))
  ) {
    return { ok: false, error: "Price filters must be non-negative numbers.", status: 400 };
  }

  return {
    ok: true,
    search: {
      q,
      city,
      gender,
      verified,
      minPrice,
      maxPrice,
      amenities: amenities.length ? amenities : undefined,
      moveInDate,
      checkOut,
      guests: moveInDate ? guests ?? 1 : undefined,
      sort,
      page,
      limit,
    },
  };
}
