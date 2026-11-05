import {
  normalizeSearchAlertCriteria,
  type SearchAlertCriteria,
} from "@/lib/availability-alert-criteria";
import { isNearbyCoordinates } from "@/lib/nearby-search";

export type AvailabilityAlertFormValues = {
  type: "HOSTEL" | "SEARCH";
  hostelId: string;
  q: string;
  city: string;
  gender: "" | "MALE" | "FEMALE" | "MIXED";
  minPrice: string;
  maxPrice: string;
  amenities: string[];
  verified: boolean;
  latitude: string;
  longitude: string;
  checkIn: string;
  checkOut: string;
  guests: string;
};

export type AvailabilityAlertFormInitial = {
  id?: string;
  type: "HOSTEL" | "SEARCH";
  hostelId?: string;
  criteria?: SearchAlertCriteria;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
};

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function initialAvailabilityAlertFormValues(
  initial?: AvailabilityAlertFormInitial,
): AvailabilityAlertFormValues {
  const criteria = initial?.criteria;
  const nearby = criteria?.nearby;
  return {
    type: initial?.type ?? "SEARCH",
    hostelId: initial?.hostelId ?? "",
    q: criteria?.q ?? "",
    city: criteria?.city ?? "",
    gender: criteria?.gender ?? "",
    minPrice: criteria?.minPrice === undefined ? "" : String(criteria.minPrice),
    maxPrice: criteria?.maxPrice === undefined ? "" : String(criteria.maxPrice),
    amenities: criteria?.amenities ?? [],
    verified: criteria?.verified ?? false,
    latitude: nearby ? String(nearby.latitude) : "",
    longitude: nearby ? String(nearby.longitude) : "",
    checkIn: initial?.checkIn ?? "",
    checkOut: initial?.checkOut ?? "",
    guests: String(initial?.guests ?? 1),
  };
}

export function buildAvailabilityAlertInput(values: AvailabilityAlertFormValues) {
  if (
    !isCalendarDate(values.checkIn) ||
    !isCalendarDate(values.checkOut) ||
    values.checkOut <= values.checkIn
  ) {
    throw new Error("Choose valid check-in and check-out dates.");
  }
  const guests = Number(values.guests);
  if (!Number.isInteger(guests) || guests < 1 || guests > 4) {
    throw new Error("Guest count must be between 1 and 4.");
  }

  if (values.type === "HOSTEL") {
    const hostelId = values.hostelId.trim();
    if (!hostelId) throw new Error("Choose a hostel from its detail page.");
    return {
      type: "HOSTEL" as const,
      hostelId,
      checkIn: values.checkIn,
      checkOut: values.checkOut,
      guests,
    };
  }

  const hasLatitude = values.latitude.trim().length > 0;
  const hasLongitude = values.longitude.trim().length > 0;
  if (hasLatitude !== hasLongitude) {
    throw new Error("Enter both nearby coordinates.");
  }
  const latitude = hasLatitude ? Number(values.latitude) : undefined;
  const longitude = hasLongitude ? Number(values.longitude) : undefined;
  const nearby =
    latitude !== undefined && longitude !== undefined
      ? { latitude, longitude }
      : undefined;
  if (nearby && !isNearbyCoordinates(nearby)) {
    throw new Error("Nearby coordinates are invalid.");
  }

  const criteria = normalizeSearchAlertCriteria({
    q: values.q,
    city: values.city,
    gender: values.gender || undefined,
    minPrice: values.minPrice.trim() ? Number(values.minPrice) : undefined,
    maxPrice: values.maxPrice.trim() ? Number(values.maxPrice) : undefined,
    amenities: values.amenities,
    ...(values.verified ? { verified: true } : {}),
    ...(nearby ? { nearby } : {}),
  });
  return {
    type: "SEARCH" as const,
    criteria,
    checkIn: values.checkIn,
    checkOut: values.checkOut,
    guests,
  };
}
