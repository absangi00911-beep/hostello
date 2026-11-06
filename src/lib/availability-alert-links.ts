import {
  normalizeSearchAlertCriteria,
  type SearchAlertCriteria,
} from "@/lib/availability-alert-criteria";

type SearchAlertLinkInput = SearchAlertCriteria & {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
};

type HostelAlertLinkInput = {
  hostelId: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
};

type AvailabilityAlertSearchDestinationInput = {
  criteria: unknown;
  checkIn: string | Date;
  checkOut: string | Date;
  guests: number;
};

function isCalendarDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function dateOnly(value: string | Date): string | null {
  const date = value instanceof Date
    ? value
    : /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00.000Z`)
      : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const result = date.toISOString().slice(0, 10);
  return isCalendarDate(result) ? result : null;
}

function setStayParams(
  params: URLSearchParams,
  stay: Pick<SearchAlertLinkInput, "checkIn" | "checkOut" | "guests">,
) {
  if (isCalendarDate(stay.checkIn)) params.set("checkIn", stay.checkIn);
  if (isCalendarDate(stay.checkOut)) params.set("checkOut", stay.checkOut);
  if (
    Number.isInteger(stay.guests) &&
    stay.guests !== undefined &&
    stay.guests >= 1 &&
    stay.guests <= 4
  ) {
    params.set("guests", String(stay.guests));
  }
}

export function buildHostelAvailabilityAlertHref(input: HostelAlertLinkInput) {
  const params = new URLSearchParams({ type: "HOSTEL" });
  if (input.hostelId.trim()) params.set("hostelId", input.hostelId.trim());
  setStayParams(params, input);
  return `/student/availability-alerts?${params.toString()}`;
}

export function buildSearchAvailabilityAlertHref(input: SearchAlertLinkInput) {
  const params = new URLSearchParams({ type: "SEARCH" });
  const { checkIn, checkOut, guests, nearby, ...filters } = input;

  try {
    const criteria = normalizeSearchAlertCriteria({
      ...filters,
      ...(nearby ? { nearby } : {}),
    });
    for (const [key, value] of Object.entries(criteria)) {
      if (key === "amenities" && Array.isArray(value)) {
        for (const amenity of value) params.append("amenities", amenity);
      } else if (key === "nearby" && typeof value === "object" && value !== null) {
        if ("latitude" in value && "longitude" in value) {
          params.set("latitude", String(value.latitude));
          params.set("longitude", String(value.longitude));
        }
      } else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        params.set(key, String(value));
      }
    }
  } catch {
    // Invalid filters are omitted; the alert form remains editable.
  }

  setStayParams(params, { checkIn, checkOut, guests });
  return `/student/availability-alerts?${params.toString()}`;
}

export function buildAvailabilityAlertSearchResultsHref(
  input: AvailabilityAlertSearchDestinationInput,
) {
  const checkIn = dateOnly(input.checkIn);
  const checkOut = dateOnly(input.checkOut);
  if (
    !checkIn ||
    !checkOut ||
    checkOut <= checkIn ||
    !Number.isInteger(input.guests) ||
    input.guests < 1 ||
    input.guests > 4
  ) {
    return null;
  }

  let criteria: SearchAlertCriteria;
  try {
    criteria = normalizeSearchAlertCriteria(input.criteria);
  } catch {
    return null;
  }

  const params = new URLSearchParams();
  if (criteria.q) params.set("q", criteria.q);
  if (criteria.city) params.set("city", criteria.city);
  if (criteria.gender) params.set("gender", criteria.gender);
  if (criteria.minPrice !== undefined) {
    params.set("minPrice", String(criteria.minPrice));
  }
  if (criteria.maxPrice !== undefined) {
    params.set("maxPrice", String(criteria.maxPrice));
  }
  for (const amenity of criteria.amenities ?? []) {
    params.append("amenities", amenity);
  }
  if (criteria.verified) params.set("verified", "true");
  if (criteria.nearby) {
    params.set("nearby", "true");
    params.set("latitude", String(criteria.nearby.latitude));
    params.set("longitude", String(criteria.nearby.longitude));
  }
  params.set("moveInDate", checkIn);
  params.set("checkOut", checkOut);
  params.set("guests", String(input.guests));
  return `/search?${params.toString()}`;
}
