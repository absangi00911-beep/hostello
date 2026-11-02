export const LISTING_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "ACTIVE",
  "SUSPENDED",
] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];
export type ListingStatusFilter = ListingStatus | "ALL";

export interface OwnerListing {
  id: string;
  name: string;
  slug: string;
  status: ListingStatus;
  city: string;
  area: string | null;
  pricePerMonth: number;
  rooms: number;
  capacity: number;
  coverImage: string | null;
  rating: number;
  reviewCount: number;
}

export interface OwnerListingsPage {
  data: OwnerListing[];
  total: number;
  page: number;
  hasMore: boolean;
}

export const STATUS_FILTERS: ReadonlyArray<{
  value: ListingStatusFilter;
  label: string;
}> = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Live" },
  { value: "PENDING_REVIEW", label: "Pending review" },
  { value: "DRAFT", label: "Drafts" },
  { value: "SUSPENDED", label: "Suspended" },
];

export function getListingStatusLabel(status: ListingStatus): string {
  switch (status) {
    case "ACTIVE":
      return "Live";
    case "PENDING_REVIEW":
      return "Pending review";
    case "DRAFT":
      return "Draft";
    case "SUSPENDED":
      return "Suspended";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isListingStatus(value: unknown): value is ListingStatus {
  return (
    typeof value === "string" &&
    (LISTING_STATUSES as readonly string[]).includes(value)
  );
}

function parseListing(value: unknown): OwnerListing | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.slug !== "string" ||
    !isListingStatus(value.status) ||
    typeof value.city !== "string" ||
    !(typeof value.area === "string" || value.area == null) ||
    typeof value.pricePerMonth !== "number" ||
    typeof value.rooms !== "number" ||
    typeof value.capacity !== "number" ||
    !(typeof value.coverImage === "string" || value.coverImage == null) ||
    typeof value.rating !== "number" ||
    typeof value.reviewCount !== "number"
  ) {
    return null;
  }
  return {
    id: value.id,
    name: value.name,
    slug: value.slug,
    status: value.status,
    city: value.city,
    area: value.area ?? null,
    pricePerMonth: value.pricePerMonth,
    rooms: value.rooms,
    capacity: value.capacity,
    coverImage: value.coverImage ?? null,
    rating: value.rating,
    reviewCount: value.reviewCount,
  };
}

export function parseListingsPage(value: unknown): OwnerListingsPage | null {
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
  if (data.some((item) => item === null)) return null;
  return {
    data: data as OwnerListing[],
    total: value.total,
    page: value.page,
    hasMore: value.hasMore,
  };
}

export function readListingsError(value: unknown, fallback: string): string {
  return isRecord(value) && typeof value.error === "string"
    ? value.error
    : fallback;
}
