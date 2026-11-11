// Path: src/lib/hostel-share-card.ts
import { db } from "@/lib/db";
import { hostelIdOrSlugWhere } from "@/lib/hostel-service";
import {
  getHostelLocation,
  getStartingPrice,
  type HostelMetadataInput,
} from "@/lib/hostel-metadata";
import { isBoundedRouteParam, MAX_HOSTEL_ROUTE_PARAM_LENGTH } from "@/lib/route-params";

export type HostelShareCardInput = Pick<
  HostelMetadataInput,
  "name" | "city" | "area" | "gender" | "pricePerMonth" | "rating" | "reviewCount" | "rooms_rel"
>;

export interface HostelShareCard {
  name: string;
  location: string;
  genderLabel: string;
  priceLabel: string | null;
  ratingLabel: string | null;
}

const MAX_NAME_LENGTH = 70;

function genderLabel(gender: string): string {
  switch (gender) {
    case "MALE":
      return "Men\u2019s hostel";
    case "FEMALE":
      return "Women\u2019s hostel";
    default:
      return "Student hostel";
  }
}

function clip(text: string, max: number): string {
  const trimmed = text.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1).trimEnd()}\u2026`;
}

/** Pure: the text shown on the card. Listing facts only, never owner free text. */
export function buildHostelShareCard(hostel: HostelShareCardInput): HostelShareCard {
  const startingPrice = getStartingPrice(hostel);
  const hasRating = hostel.reviewCount > 0 && hostel.rating !== null && hostel.rating > 0;

  return {
    name: clip(hostel.name, MAX_NAME_LENGTH),
    location: getHostelLocation(hostel),
    genderLabel: genderLabel(hostel.gender),
    priceLabel:
      startingPrice > 0
        ? `From PKR ${new Intl.NumberFormat("en-US").format(Math.round(startingPrice))}/month`
        : null,
    ratingLabel: hasRating
      ? `${(hostel.rating as number).toFixed(1)}/5 \u00b7 ${hostel.reviewCount} ${
          hostel.reviewCount === 1 ? "review" : "reviews"
        }`
      : null,
  };
}

/** Lightweight lookup (no owner, reviews or photos). Null for missing or non-active listings. */
export async function getHostelShareCard(param: string): Promise<HostelShareCard | null> {
  if (!isBoundedRouteParam(param, MAX_HOSTEL_ROUTE_PARAM_LENGTH)) return null;

  const hostel = await db.hostel.findFirst({
    where: { ...hostelIdOrSlugWhere(param), status: "ACTIVE" },
    select: {
      name: true,
      city: true,
      area: true,
      gender: true,
      pricePerMonth: true,
      rating: true,
      reviewCount: true,
      rooms_rel: {
        where: { capacity: { gt: 0 } },
        select: { pricePerMonth: true },
      },
    },
  });

  return hostel ? buildHostelShareCard(hostel) : null;
}
