import { getPakistanCalendarDate } from "@hostello/shared";
import { AMENITIES } from "@hostello/shared";
import { isNearbyCoordinates } from "@/lib/nearby-search";

export type SearchAlertCriteria = {
  q?: string;
  city?: string;
  gender?: "MALE" | "FEMALE" | "MIXED";
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  verified?: boolean;
  nearby?: { latitude: number; longitude: number };
};

const MAX_SEARCH_LENGTH = 200;
const MAX_CITY_LENGTH = 100;
const MAX_AMENITY_FILTERS = 30;
const MAX_PRICE = 2_147_483_647;
const SUPPORTED_AMENITIES = new Set(AMENITIES.map((amenity) => amenity.id));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalText(value: unknown, maxLength: number, label: string) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length > maxLength) {
    throw new Error(`${label} is invalid.`);
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function optionalPrice(value: unknown, label: string) {
  if (value === undefined) return undefined;
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > MAX_PRICE
  ) {
    throw new Error(`${label} is invalid.`);
  }
  return value;
}

export function normalizeSearchAlertCriteria(value: unknown): SearchAlertCriteria {
  if (!isRecord(value)) throw new Error("Search criteria must be an object.");

  const q = optionalText(value.q, MAX_SEARCH_LENGTH, "Search query");
  const city = optionalText(value.city, MAX_CITY_LENGTH, "City");
  const gender = value.gender;
  if (
    gender !== undefined &&
    gender !== "MALE" &&
    gender !== "FEMALE" &&
    gender !== "MIXED"
  ) {
    throw new Error("Gender is invalid.");
  }

  const minPrice = optionalPrice(value.minPrice, "Minimum price");
  const maxPrice = optionalPrice(value.maxPrice, "Maximum price");
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new Error("Price range is invalid.");
  }

  let amenities: string[] | undefined;
  if (value.amenities !== undefined) {
    if (
      !Array.isArray(value.amenities) ||
      value.amenities.length > MAX_AMENITY_FILTERS ||
      !value.amenities.every(
        (amenity) =>
          typeof amenity === "string" && SUPPORTED_AMENITIES.has(amenity),
      )
    ) {
      throw new Error("Amenities are invalid.");
    }
    amenities = [...new Set(value.amenities)].sort();
    if (amenities.length === 0) amenities = undefined;
  }

  if (value.verified !== undefined && typeof value.verified !== "boolean") {
    throw new Error("Verified filter is invalid.");
  }
  if (value.nearby !== undefined && !isNearbyCoordinates(value.nearby)) {
    throw new Error("Nearby coordinates are invalid.");
  }

  return {
    ...(q ? { q } : {}),
    ...(city ? { city } : {}),
    ...(gender ? { gender } : {}),
    ...(minPrice !== undefined ? { minPrice } : {}),
    ...(maxPrice !== undefined ? { maxPrice } : {}),
    ...(amenities ? { amenities } : {}),
    ...(value.verified !== undefined ? { verified: value.verified } : {}),
    ...(value.nearby ? { nearby: value.nearby } : {}),
  };
}

function parseCalendarDate(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}

export function normalizeAvailabilityAlertStay(
  value: unknown,
  today = getPakistanCalendarDate(),
) {
  if (!isRecord(value)) throw new Error("Stay details must be an object.");
  const checkIn = parseCalendarDate(value.checkIn);
  const checkOut = parseCalendarDate(value.checkOut);
  const todayDate = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  ));
  if (!checkIn || !checkOut || checkIn <= todayDate || checkOut <= checkIn) {
    throw new Error("Choose valid future check-in and check-out dates.");
  }
  if (
    typeof value.guests !== "number" ||
    !Number.isInteger(value.guests) ||
    value.guests < 1 ||
    value.guests > 4
  ) {
    throw new Error("Guest count must be between 1 and 4.");
  }
  return { checkIn, checkOut, guests: value.guests };
}
