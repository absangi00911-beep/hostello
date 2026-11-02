import { FLAGGED_THRESHOLD } from "@/lib/listingCompleteness";

export { FLAGGED_THRESHOLD };

export const ADMIN_LISTING_STATUSES = [
  "PENDING_REVIEW",
  "ACTIVE",
  "SUSPENDED",
] as const;
export type AdminListingStatus = (typeof ADMIN_LISTING_STATUSES)[number];

export const ADMIN_LISTING_TABS: ReadonlyArray<{
  value: AdminListingStatus;
  label: string;
}> = [
  { value: "PENDING_REVIEW", label: "Pending review" },
  { value: "ACTIVE", label: "Live" },
  { value: "SUSPENDED", label: "Suspended" },
];

/** Same limits as the schema in `src/app/api/admin/hostels/route.ts`. */
export const SUSPEND_REASON_MAX = 500;
export const VERIFY_NOTES_MAX = 2000;

export interface AdminListing {
  id: string;
  name: string;
  slug: string;
  status: AdminListingStatus;
  city: string;
  verified: boolean;
  createdAt: string;
  completeness: number;
  description: string;
  images: string[];
  amenities: string[];
  rules: string[];
  ownerName: string;
  ownerEmail: string;
}

export interface AdminListingsPage {
  data: AdminListing[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface AdminListingStats {
  totalListings: number;
  pendingApproval: number;
  flaggedCount: number;
  newlyPublished: number;
  newlyPublishedWindowDays: number;
  flaggedThreshold: number;
}

export interface AdminListingDetail {
  area: string | null;
  address: string;
  gender: string;
  pricePerMonth: number;
  capacity: number;
  rooms: Array<{ id: string; name: string; pricePerMonth: number; capacity: number }>;
  ownerName: string;
  ownerEmail: string;
  ownerSince: string | null;
  ownerListingCount: number;
}

export type ModerationAction = "verify" | "suspend" | "activate";

export interface VerificationChecks {
  ownerAuthorityChecked: boolean;
  locationChecked: boolean;
  listingDetailsChecked: boolean;
  photosChecked: boolean;
}

export const VERIFICATION_CHECK_LABELS: ReadonlyArray<{
  key: keyof VerificationChecks;
  label: string;
}> = [
  { key: "ownerAuthorityChecked", label: "The owner is allowed to list this property" },
  { key: "locationChecked", label: "The address and location are correct" },
  { key: "listingDetailsChecked", label: "The description, rooms and prices are accurate" },
  { key: "photosChecked", label: "The photos show this property" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function stringArray(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? (value as string[])
    : null;
}

function parseListing(value: unknown): AdminListing | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.slug !== "string" ||
    typeof value.status !== "string" ||
    !(ADMIN_LISTING_STATUSES as readonly string[]).includes(value.status) ||
    typeof value.city !== "string" ||
    typeof value.verified !== "boolean" ||
    !isValidDateString(value.createdAt) ||
    typeof value.completeness !== "number" ||
    !isRecord(value.owner) ||
    typeof value.owner.name !== "string" ||
    typeof value.owner.email !== "string"
  ) {
    return null;
  }
  const images = stringArray(value.images ?? []);
  const amenities = stringArray(value.amenities ?? []);
  const rules = stringArray(value.rules ?? []);
  if (!images || !amenities || !rules) return null;
  return {
    id: value.id,
    name: value.name,
    slug: value.slug,
    status: value.status as AdminListingStatus,
    city: value.city,
    verified: value.verified,
    createdAt: value.createdAt,
    completeness: value.completeness,
    description: typeof value.description === "string" ? value.description : "",
    images,
    amenities,
    rules,
    ownerName: value.owner.name,
    ownerEmail: value.owner.email,
  };
}

/** Parses `GET /api/admin/listings`; null when the shape is unexpected. */
export function parseAdminListingsPage(value: unknown): AdminListingsPage | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.data) ||
    typeof value.total !== "number" ||
    typeof value.page !== "number" ||
    typeof value.hasMore !== "boolean"
  ) {
    return null;
  }
  const data = value.data.map(parseListing);
  if (data.some((listing) => listing === null)) return null;
  return {
    data: data as AdminListing[],
    total: value.total,
    page: value.page,
    hasMore: value.hasMore,
  };
}

/** Parses `GET /api/admin/listings/stats`. */
export function parseAdminListingStats(value: unknown): AdminListingStats | null {
  if (!isRecord(value) || !isRecord(value.data)) return null;
  const d = value.data;
  if (
    typeof d.totalListings !== "number" ||
    typeof d.pendingApproval !== "number" ||
    typeof d.flaggedCount !== "number" ||
    typeof d.newlyPublished !== "number" ||
    typeof d.newlyPublishedWindowDays !== "number" ||
    typeof d.flaggedThreshold !== "number"
  ) {
    return null;
  }
  return {
    totalListings: d.totalListings,
    pendingApproval: d.pendingApproval,
    flaggedCount: d.flaggedCount,
    newlyPublished: d.newlyPublished,
    newlyPublishedWindowDays: d.newlyPublishedWindowDays,
    flaggedThreshold: d.flaggedThreshold,
  };
}

/** Parses `GET /api/hostels/[param]` (admin-only) for the review details. */
export function parseAdminListingDetail(value: unknown): AdminListingDetail | null {
  if (!isRecord(value) || !isRecord(value.data)) return null;
  const d = value.data;
  if (
    typeof d.address !== "string" ||
    typeof d.gender !== "string" ||
    typeof d.pricePerMonth !== "number" ||
    typeof d.capacity !== "number" ||
    !isRecord(d.owner) ||
    typeof d.owner.name !== "string" ||
    typeof d.owner.email !== "string"
  ) {
    return null;
  }
  const rooms = Array.isArray(d.rooms_rel)
    ? d.rooms_rel.flatMap((room: unknown) =>
        isRecord(room) &&
        typeof room.id === "string" &&
        typeof room.name === "string" &&
        typeof room.pricePerMonth === "number" &&
        typeof room.capacity === "number"
          ? [
              {
                id: room.id,
                name: room.name,
                pricePerMonth: room.pricePerMonth,
                capacity: room.capacity,
              },
            ]
          : [],
      )
    : [];
  const count = isRecord(d.owner._count) ? d.owner._count.hostels : null;
  return {
    area: typeof d.area === "string" ? d.area : null,
    address: d.address,
    gender: d.gender,
    pricePerMonth: d.pricePerMonth,
    capacity: d.capacity,
    rooms,
    ownerName: d.owner.name,
    ownerEmail: d.owner.email,
    ownerSince: isValidDateString(d.owner.createdAt) ? d.owner.createdAt : null,
    ownerListingCount: typeof count === "number" ? count : 0,
  };
}

export function readAdminError(value: unknown, fallback: string): string {
  return isRecord(value) && typeof value.error === "string"
    ? value.error
    : fallback;
}

export function allChecksDone(checks: VerificationChecks): boolean {
  return VERIFICATION_CHECK_LABELS.every(({ key }) => checks[key]);
}

export function validateSuspendReason(reason: string): string | null {
  return reason.trim().length > SUSPEND_REASON_MAX
    ? `The reason can be at most ${SUSPEND_REASON_MAX} characters.`
    : null;
}

export function validateVerifyNotes(notes: string): string | null {
  return notes.trim().length > VERIFY_NOTES_MAX
    ? `Notes can be at most ${VERIFY_NOTES_MAX} characters.`
    : null;
}

/** Builds the `PATCH /api/admin/hostels` body; empty optional fields are left out. */
export function buildModerationBody(
  hostelId: string,
  action: ModerationAction,
  input: { reason?: string; checks?: VerificationChecks; notes?: string },
) {
  if (action === "verify") {
    const notes = input.notes?.trim();
    return {
      hostelId,
      action,
      verification: { ...input.checks, ...(notes ? { notes } : {}) },
    };
  }
  const reason = input.reason?.trim();
  return { hostelId, action, ...(action === "suspend" && reason ? { reason } : {}) };
}

export function moderationSuccessMessage(
  action: ModerationAction,
  listingName: string,
): string {
  switch (action) {
    case "verify":
      return `${listingName} is verified and live. The owner has been notified.`;
    case "suspend":
      return `${listingName} was suspended. The owner has been notified.`;
    case "activate":
      return `${listingName} is live again. The owner has been notified.`;
  }
}
