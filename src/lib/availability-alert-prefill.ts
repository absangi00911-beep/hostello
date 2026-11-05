import { AMENITIES } from "@hostello/shared";
import {
  normalizeSearchAlertCriteria,
  type SearchAlertCriteria,
} from "@/lib/availability-alert-criteria";
import type { AvailabilityAlertFormInitial } from "@/components/student/availability-alert-form-model";
import {
  buildHostelAvailabilityAlertHref,
  buildSearchAvailabilityAlertHref,
} from "@/lib/availability-alert-links";
import { isNearbyCoordinates } from "@/lib/nearby-search";

function isCalendarDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function optionalInteger(params: URLSearchParams, name: string) {
  const value = params.get(name);
  if (!value || !/^\d+$/.test(value)) return undefined;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : undefined;
}

function getStay(params: URLSearchParams) {
  const checkIn = params.get("checkIn");
  const checkOut = params.get("checkOut");
  const guests = optionalInteger(params, "guests");
  return {
    ...(isCalendarDate(checkIn) ? { checkIn } : {}),
    ...(isCalendarDate(checkOut) ? { checkOut } : {}),
    ...(guests !== undefined && guests >= 1 && guests <= 4 ? { guests } : {}),
  };
}

export function parseAvailabilityAlertPrefill(
  params: URLSearchParams,
): AvailabilityAlertFormInitial | null {
  const stay = getStay(params);
  if (params.get("type") === "HOSTEL") {
    const hostelId = params.get("hostelId") ?? "";
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(hostelId)) return null;
    return { type: "HOSTEL", hostelId, ...stay };
  }
  if (params.get("type") !== "SEARCH") return null;

  const gender = params.get("gender");
  const minPrice = optionalInteger(params, "minPrice");
  const maxPrice = optionalInteger(params, "maxPrice");
  const latitudeValue = params.get("latitude");
  const longitudeValue = params.get("longitude");
  const latitude =
    latitudeValue !== null && latitudeValue.trim() !== ""
      ? Number(latitudeValue)
      : undefined;
  const longitude =
    longitudeValue !== null && longitudeValue.trim() !== ""
      ? Number(longitudeValue)
      : undefined;
  const nearby =
    latitude !== undefined &&
    longitude !== undefined &&
    isNearbyCoordinates({ latitude, longitude })
      ? { latitude, longitude }
      : undefined;
  const rawCriteria = {
    ...(params.get("q") ? { q: params.get("q") } : {}),
    ...(params.get("city") ? { city: params.get("city") } : {}),
    ...(gender === "MALE" || gender === "FEMALE" || gender === "MIXED"
      ? { gender }
      : {}),
    ...(minPrice !== undefined ? { minPrice } : {}),
    ...(maxPrice !== undefined ? { maxPrice } : {}),
    ...(params.getAll("amenities").length
      ? {
          amenities: params
            .getAll("amenities")
            .filter((amenity) => AMENITIES.some((item) => item.id === amenity)),
        }
      : {}),
    ...(params.get("verified") === "true" ? { verified: true } : {}),
    ...(nearby ? { nearby } : {}),
  };

  let criteria: SearchAlertCriteria | undefined;
  try {
    criteria = normalizeSearchAlertCriteria(rawCriteria);
  } catch {
    criteria = undefined;
  }
  return {
    type: "SEARCH",
    ...(criteria && Object.keys(criteria).length > 0 ? { criteria } : {}),
    ...stay,
  };
}

export function buildAvailabilityAlertDestination(
  initial: AvailabilityAlertFormInitial | null,
) {
  if (!initial) return "/student/availability-alerts";
  if (initial.type === "HOSTEL") {
    return buildHostelAvailabilityAlertHref({
      hostelId: initial.hostelId ?? "",
      checkIn: initial.checkIn,
      checkOut: initial.checkOut,
      guests: initial.guests,
    });
  }
  return buildSearchAvailabilityAlertHref({
    ...(initial.criteria ?? {}),
    checkIn: initial.checkIn,
    checkOut: initial.checkOut,
    guests: initial.guests,
  });
}
