// Path: src/lib/hostel-jsonld.ts
import { getCityPathForName } from "@/lib/city-pages";
import { buildHostelDescription, getHostelCanonicalPath, getStartingPrice } from "@/lib/hostel-metadata";
import type { HostelMetadataInput } from "@/lib/hostel-metadata";

const MAX_IMAGES = 6;
const MAX_DESCRIPTION_LENGTH = 500;

export interface HostelJsonLdInput extends HostelMetadataInput {
  description: string | null;
  rooms: number;
  latitude: number | null;
  longitude: number | null;
}

function absoluteUrl(siteUrl: string, src: string): string | null {
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/")) return `${siteUrl}${src}`;
  return null;
}

function cleanDescription(text: string | null | undefined): string | null {
  const collapsed = text?.replace(/\s+/g, " ").trim();
  if (!collapsed) return null;
  return collapsed.length <= MAX_DESCRIPTION_LENGTH
    ? collapsed
    : `${collapsed.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}\u2026`;
}

/**
 * schema.org data for a hostel page: the Hostel itself plus its breadcrumb trail.
 * Only fields that are visible on the page are included. Coordinates must be the
 * already-rounded public values, never the owner's exact location.
 */
export function buildHostelJsonLd(hostel: HostelJsonLdInput, siteUrl: string | undefined) {
  if (!siteUrl) return null;

  const url = `${siteUrl}${getHostelCanonicalPath(hostel)}`;
  const images = [hostel.coverImage, ...hostel.images]
    .map((src) => src?.trim())
    .filter((src): src is string => Boolean(src))
    .map((src) => absoluteUrl(siteUrl, src))
    .filter((src): src is string => src !== null)
    .slice(0, MAX_IMAGES);
  const amenities = hostel.amenities.map((name) => name.trim()).filter(Boolean);
  const startingPrice = getStartingPrice(hostel);

  const lodging: Record<string, unknown> = {
    "@type": "Hostel",
    "@id": `${url}#hostel`,
    name: hostel.name,
    url,
    description: cleanDescription(hostel.description) ?? buildHostelDescription(hostel),
    address: {
      "@type": "PostalAddress",
      addressLocality: hostel.city,
      addressCountry: "PK",
    },
  };

  if (images.length > 0) lodging.image = images;
  if (hostel.latitude !== null && hostel.longitude !== null) {
    lodging.geo = {
      "@type": "GeoCoordinates",
      latitude: hostel.latitude,
      longitude: hostel.longitude,
    };
  }
  if (startingPrice > 0) {
    lodging.priceRange = `PKR ${new Intl.NumberFormat("en-US").format(startingPrice)}+ per month`;
  }
  if (hostel.rooms > 0) lodging.numberOfRooms = hostel.rooms;
  if (amenities.length > 0) {
    lodging.amenityFeature = amenities.map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    }));
  }
  if (hostel.reviewCount > 0 && hostel.rating && hostel.rating > 0) {
    lodging.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(hostel.rating.toFixed(2)),
      reviewCount: hostel.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Link the city page when it exists; otherwise fall back to filtered search.
  const cityPath = getCityPathForName(hostel.city) ?? `/search?city=${encodeURIComponent(hostel.city)}`;
  const breadcrumbs = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: `Hostels in ${hostel.city}`,
        item: `${siteUrl}${cityPath}`,
      },
      { "@type": "ListItem", position: 3, name: hostel.name, item: url },
    ],
  };

  return { "@context": "https://schema.org", "@graph": [lodging, breadcrumbs] };
}
