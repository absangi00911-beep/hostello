// Path: src/lib/hostel-metadata.ts
import type { Metadata } from "next";

export interface HostelMetadataInput {
  id: string;
  slug: string;
  name: string;
  city: string;
  area: string | null;
  gender: string;
  pricePerMonth: number;
  rating: number | null;
  reviewCount: number;
  amenities: string[];
  coverImage: string | null;
  images: string[];
}

const MAX_DESCRIPTION_LENGTH = 160;
const MAX_AMENITIES_IN_DESCRIPTION = 3;

function genderNoun(gender: string): string {
  switch (gender) {
    case "MALE":
      return "Men\u2019s hostel";
    case "FEMALE":
      return "Women\u2019s hostel";
    default:
      return "Student hostel";
  }
}

function formatPkr(amount: number): string {
  return `PKR ${new Intl.NumberFormat("en-US").format(Math.round(amount))}`;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}\u2026`;
}

export function getHostelLocation(hostel: Pick<HostelMetadataInput, "area" | "city">): string {
  const area = hostel.area?.trim();
  return area ? `${area}, ${hostel.city}` : hostel.city;
}

/** Canonical path. The page also resolves by id, so always point at the slug. */
export function getHostelCanonicalPath(hostel: Pick<HostelMetadataInput, "id" | "slug">): string {
  return `/hostels/${encodeURIComponent(hostel.slug || hostel.id)}`;
}

/** Built only from listing facts, never from free-text owner content. */
export function buildHostelDescription(hostel: HostelMetadataInput): string {
  const parts = [`${genderNoun(hostel.gender)} in ${getHostelLocation(hostel)}.`];

  if (hostel.pricePerMonth > 0) {
    parts.push(`Rooms from ${formatPkr(hostel.pricePerMonth)}/month.`);
  }
  if (hostel.reviewCount > 0 && hostel.rating && hostel.rating > 0) {
    const reviews = hostel.reviewCount === 1 ? "1 review" : `${hostel.reviewCount} reviews`;
    parts.push(`Rated ${hostel.rating.toFixed(1)}/5 from ${reviews}.`);
  }
  const amenities = hostel.amenities
    .map((amenity) => amenity.trim())
    .filter(Boolean)
    .slice(0, MAX_AMENITIES_IN_DESCRIPTION);
  if (amenities.length > 0) parts.push(`Includes ${amenities.join(", ")}.`);
  parts.push("Book online on HostelLo.");

  return truncate(parts.join(" "), MAX_DESCRIPTION_LENGTH);
}

export function buildHostelMetadata(hostel: HostelMetadataInput): Metadata {
  const title = `${hostel.name} in ${getHostelLocation(hostel)}`;
  const description = buildHostelDescription(hostel);
  const canonical = getHostelCanonicalPath(hostel);
  const image = [hostel.coverImage, ...hostel.images]
    .map((src) => src?.trim())
    .find((src): src is string => Boolean(src));
  const images = image ? [{ url: image, alt: hostel.name }] : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      ...(images ? { images: [images[0].url] } : {}),
    },
  };
}

/** Missing, draft or suspended listings must not be indexed. */
export function buildHostelNotFoundMetadata(): Metadata {
  return {
    title: "Hostel not found",
    robots: { index: false, follow: false },
  };
}
