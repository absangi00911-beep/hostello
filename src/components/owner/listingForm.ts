import { AMENITIES, CITIES, MAX_IMAGES_PER_HOSTEL } from "@hostello/shared";
import {
  CANCELLATION_POLICIES,
  type CancellationPolicy,
} from "@/lib/cancellation-policy";

/**
 * Form state and payload building for owner listings. Mirrors
 * `hostelCreateSchema` in packages/shared so most mistakes are caught before
 * the request; the server stays the source of truth.
 */

export type Gender = "MALE" | "FEMALE" | "MIXED";

export interface RoomFormValues {
  /** Existing room id, kept so edits preserve bookings. Absent for new rooms. */
  id?: string;
  name: string;
  description: string;
  pricePerMonth: string;
  capacity: string;
  /** Comma-separated in the UI. */
  facilities: string;
}

export interface ListingFormValues {
  name: string;
  description: string;
  gender: Gender | "";
  city: string;
  area: string;
  address: string;
  rooms: RoomFormValues[];
  amenities: string[];
  images: string[];
  minStay: string;
  maxStay: string;
  cancellationPolicy: CancellationPolicy | "";
  /** One rule per line in the UI. */
  rules: string;
}

export type ListingFormErrors = Record<string, string>;

export const LISTING_LIMITS = {
  nameMin: 3,
  nameMax: 100,
  descriptionMin: 50,
  descriptionMax: 2000,
  addressMin: 10,
  priceMin: 1000,
  priceMax: 100000,
  roomsMax: 100,
  roomNameMin: 2,
  roomNameMax: 100,
  roomDescriptionMax: 1000,
  roomCapacityMax: 100,
  facilitiesMax: 30,
  facilityMax: 100,
  rulesMax: 20,
  ruleMax: 200,
  totalCapacityMax: 1000,
  imagesMax: MAX_IMAGES_PER_HOSTEL,
} as const;

export function emptyRoom(): RoomFormValues {
  return {
    name: "",
    description: "",
    pricePerMonth: "",
    capacity: "",
    facilities: "",
  };
}

export function emptyListingForm(): ListingFormValues {
  return {
    name: "",
    description: "",
    gender: "",
    city: "",
    area: "",
    address: "",
    rooms: [emptyRoom()],
    amenities: [],
    images: [],
    minStay: "1",
    maxStay: "",
    cancellationPolicy: "",
    rules: "",
  };
}

export function splitList(value: string, separator: RegExp): string[] {
  return value
    .split(separator)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

const splitFacilities = (value: string) => splitList(value, /,/);
const splitRules = (value: string) => splitList(value, /\r?\n/);

function parseWholeNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export const roomFieldKey = (index: number, field: string) =>
  `room.${index}.${field}`;

const KNOWN_AMENITY_IDS = new Set(AMENITIES.map((amenity) => amenity.id));

export function validateListingForm(
  values: ListingFormValues,
): ListingFormErrors {
  const errors: ListingFormErrors = {};
  const L = LISTING_LIMITS;

  const name = values.name.trim();
  if (name.length < L.nameMin) {
    errors.name = `Name must be at least ${L.nameMin} characters.`;
  } else if (name.length > L.nameMax) {
    errors.name = `Name can be at most ${L.nameMax} characters.`;
  }

  const description = values.description.trim();
  if (description.length < L.descriptionMin) {
    errors.description = `Description must be at least ${L.descriptionMin} characters (${description.length} so far).`;
  } else if (description.length > L.descriptionMax) {
    errors.description = `Description can be at most ${L.descriptionMax} characters.`;
  }

  if (!values.gender) errors.gender = "Select who the hostel is for.";
  if (!values.city) errors.city = "Select a city.";
  if (values.address.trim().length < L.addressMin) {
    errors.address = `Enter the full address (at least ${L.addressMin} characters).`;
  }

  if (values.rooms.length === 0) {
    errors.rooms = "Add at least one room type.";
  } else if (values.rooms.length > L.roomsMax) {
    errors.rooms = `You can add at most ${L.roomsMax} room types.`;
  }

  let totalCapacity = 0;
  values.rooms.forEach((room, index) => {
    const roomName = room.name.trim();
    if (roomName.length < L.roomNameMin || roomName.length > L.roomNameMax) {
      errors[roomFieldKey(index, "name")] =
        `Room name must be ${L.roomNameMin}–${L.roomNameMax} characters.`;
    }
    if (room.description.trim().length > L.roomDescriptionMax) {
      errors[roomFieldKey(index, "description")] =
        `Description can be at most ${L.roomDescriptionMax} characters.`;
    }
    const price = parseWholeNumber(room.pricePerMonth);
    if (price === null || price < L.priceMin || price > L.priceMax) {
      errors[roomFieldKey(index, "pricePerMonth")] =
        `Price must be a whole number from Rs. ${L.priceMin.toLocaleString("en-PK")} to Rs. ${L.priceMax.toLocaleString("en-PK")}.`;
    }
    const capacity = parseWholeNumber(room.capacity);
    if (capacity === null || capacity < 1 || capacity > L.roomCapacityMax) {
      errors[roomFieldKey(index, "capacity")] =
        `Beds must be a whole number from 1 to ${L.roomCapacityMax}.`;
    } else {
      totalCapacity += capacity;
    }
    const facilities = splitFacilities(room.facilities);
    if (
      facilities.length > L.facilitiesMax ||
      facilities.some((facility) => facility.length > L.facilityMax)
    ) {
      errors[roomFieldKey(index, "facilities")] =
        `Use at most ${L.facilitiesMax} facilities of ${L.facilityMax} characters or fewer.`;
    }
  });
  if (!errors.rooms && totalCapacity > L.totalCapacityMax) {
    errors.rooms = `Total beds across rooms can be at most ${L.totalCapacityMax}.`;
  }

  if (values.amenities.length === 0) {
    errors.amenities = "Select at least one amenity.";
  }

  const minStay = parseWholeNumber(values.minStay);
  if (minStay === null || minStay < 1) {
    errors.minStay = "Minimum stay must be a whole number of months, at least 1.";
  }
  if (values.maxStay.trim() !== "") {
    const maxStay = parseWholeNumber(values.maxStay);
    if (maxStay === null || maxStay < 1) {
      errors.maxStay = "Maximum stay must be a whole number of months.";
    } else if (minStay !== null && maxStay < minStay) {
      errors.maxStay = "Maximum stay can't be shorter than the minimum stay.";
    }
  }

  if (!values.cancellationPolicy) {
    errors.cancellationPolicy = "Choose a cancellation policy.";
  }

  const rules = splitRules(values.rules);
  if (rules.length > L.rulesMax || rules.some((rule) => rule.length > L.ruleMax)) {
    errors.rules = `Use at most ${L.rulesMax} rules of ${L.ruleMax} characters or fewer.`;
  }

  if (values.images.length > L.imagesMax) {
    errors.images = `You can add at most ${L.imagesMax} photos.`;
  }

  return errors;
}

export interface ListingPayload {
  name: string;
  description: string;
  city: string;
  area?: string;
  address: string;
  pricePerMonth: number;
  rooms: number;
  capacity: number;
  gender: Gender;
  cancellationPolicy: CancellationPolicy;
  minStay: number;
  maxStay?: number;
  amenities: string[];
  rules: string[];
  images: string[];
  coverImage?: string;
  roomTypes: Array<{
    id?: string;
    name: string;
    description?: string;
    pricePerMonth: number;
    capacity: number;
    facilities: string[];
    images: string[];
  }>;
}

/**
 * Builds the request body. Hostel-level price, room count and bed count are
 * derived from the room entries (the lowest room price is the "from" price),
 * so owners never enter totals that could disagree with their rooms.
 * Call only after `validateListingForm` returns no errors.
 */
export function buildListingPayload(values: ListingFormValues): ListingPayload {
  const roomTypes = values.rooms.map((room) => ({
    ...(room.id ? { id: room.id } : {}),
    name: room.name.trim(),
    ...(room.description.trim() ? { description: room.description.trim() } : {}),
    pricePerMonth: Number(room.pricePerMonth.trim()),
    capacity: Number(room.capacity.trim()),
    facilities: splitFacilities(room.facilities),
    images: [] as string[],
  }));

  const maxStay = values.maxStay.trim();
  const area = values.area.trim();

  return {
    name: values.name.trim(),
    description: values.description.trim(),
    city: values.city,
    ...(area ? { area } : {}),
    address: values.address.trim(),
    pricePerMonth: Math.min(...roomTypes.map((room) => room.pricePerMonth)),
    rooms: roomTypes.length,
    capacity: roomTypes.reduce((sum, room) => sum + room.capacity, 0),
    gender: values.gender as Gender,
    cancellationPolicy: values.cancellationPolicy as CancellationPolicy,
    minStay: Number(values.minStay.trim()),
    ...(maxStay ? { maxStay: Number(maxStay) } : {}),
    amenities: values.amenities.filter((id) => KNOWN_AMENITY_IDS.has(id)),
    rules: splitRules(values.rules),
    images: values.images,
    ...(values.images[0] ? { coverImage: values.images[0] } : {}),
    roomTypes,
  };
}

/** Flattens the API's zod `details.fieldErrors` into readable lines. */
export function readServerFieldErrors(payload: unknown): string[] {
  if (typeof payload !== "object" || payload === null) return [];
  const details = (payload as { details?: unknown }).details;
  if (typeof details !== "object" || details === null) return [];
  const fieldErrors = (details as { fieldErrors?: unknown }).fieldErrors;
  if (typeof fieldErrors !== "object" || fieldErrors === null) return [];
  const lines: string[] = [];
  for (const messages of Object.values(fieldErrors)) {
    if (Array.isArray(messages)) {
      for (const message of messages) {
        if (typeof message === "string") lines.push(message);
      }
    }
  }
  return lines;
}

export const CITY_OPTIONS: readonly string[] = CITIES;
export const AMENITY_OPTIONS = AMENITIES;
export { CANCELLATION_POLICIES };
