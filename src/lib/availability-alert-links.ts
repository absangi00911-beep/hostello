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

function isCalendarDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
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
