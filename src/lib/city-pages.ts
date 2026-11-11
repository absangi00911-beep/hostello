// Path: src/lib/city-pages.ts
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatPkr, getStartingPrice, truncate } from "@/lib/hostel-metadata";
import { isBoundedRouteParam } from "@/lib/route-params";
import { SITE_SHARE_IMAGE } from "@/lib/site-metadata";

export const MAX_CITY_SLUG_LENGTH = 60;
export const MAX_CITY_PAGE_HOSTELS = 100;
const MAX_RELATED_CITIES = 8;
const MAX_DESCRIPTION_LENGTH = 160;

export interface CityHostel {
  id: string;
  slug: string;
  name: string;
  area: string | null;
  gender: string;
  pricePerMonth: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  amenities: string[];
  rooms_rel?: readonly { pricePerMonth: number }[];
}

export interface CityFacts {
  hostelCount: number;
  minPrice: number;
  maxPrice: number;
  verifiedCount: number;
  areas: string[];
  amenities: string[];
  genders: { MALE: number; FEMALE: number; MIXED: number };
}

export interface CitySummary {
  slug: string;
  name: string;
  /** Exact `Hostel.city` spellings that share this slug ("Lahore", "lahore "). */
  spellings: string[];
  hostelCount: number;
}

export interface CityPage extends CitySummary {
  hostels: CityHostel[];
  facts: CityFacts;
  relatedCities: CitySummary[];
}

/** "Lahore", "lahore " and "LAHORE" share one URL. Names with no Latin letters get no page. */
export function slugifyCity(city: string): string {
  return city
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCityCanonicalPath(slug: string): string {
  return `/hostels-in/${slug}`;
}

function joinList(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** The most frequent values, ties broken alphabetically. Case-insensitive; first spelling wins. */
function topValues(values: readonly (string | null | undefined)[], limit: number): string[] {
  const counts = new Map<string, { label: string; count: number }>();
  for (const value of values) {
    const label = value?.trim();
    if (!label) continue;
    const entry = counts.get(label.toLowerCase());
    if (entry) entry.count += 1;
    else counts.set(label.toLowerCase(), { label, count: 1 });
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit)
    .map((entry) => entry.label);
}

/** Pure. `total` can exceed `hostels.length` when the page list is capped. */
export function buildCityFacts(hostels: readonly CityHostel[], total = hostels.length): CityFacts {
  const prices = hostels.map(getStartingPrice).filter((price) => price > 0);
  const genders = { MALE: 0, FEMALE: 0, MIXED: 0 };
  for (const hostel of hostels) {
    if (hostel.gender === "MALE" || hostel.gender === "FEMALE") genders[hostel.gender] += 1;
    else genders.MIXED += 1;
  }
  return {
    hostelCount: total,
    minPrice: prices.length > 0 ? Math.min(...prices) : 0,
    maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
    verifiedCount: hostels.filter((hostel) => hostel.verified).length,
    areas: topValues(hostels.map((hostel) => hostel.area), 4),
    amenities: topValues(hostels.flatMap((hostel) => hostel.amenities), 4),
    genders,
  };
}

/** Intro paragraphs built only from real listing data, so no two cities read alike. */
export function buildCityIntro(city: string, facts: CityFacts): string[] {
  const { hostelCount, minPrice, maxPrice, verifiedCount, areas, amenities, genders } = facts;
  const listed =
    hostelCount === 1
      ? `1 student hostel is listed in ${city} on HostelLo.`
      : `${hostelCount} student hostels are listed in ${city} on HostelLo.`;
  const rent =
    minPrice > 0
      ? maxPrice > minPrice
        ? ` Monthly rent runs from ${formatPkr(minPrice)} to ${formatPkr(maxPrice)}.`
        : ` Monthly rent starts at ${formatPkr(minPrice)}.`
      : "";

  const paragraphs = [`${listed}${rent}`];

  const where = areas.length > 0 ? `Popular areas include ${joinList(areas)}.` : "";
  const verified =
    verifiedCount > 0
      ? `${verifiedCount} verified ${verifiedCount === 1 ? "listing" : "listings"}.`
      : "";
  if (where || verified) paragraphs.push([where, verified].filter(Boolean).join(" "));

  const mix = (
    [
      [genders.MALE, "men\u2019s"],
      [genders.FEMALE, "women\u2019s"],
      [genders.MIXED, "mixed"],
    ] as const
  )
    .filter(([count]) => count > 0)
    .map(([count, label]) => `${count} ${label}`);
  if (mix.length > 0) paragraphs.push(`The mix is ${joinList(mix)}.`);

  if (amenities.length > 0) paragraphs.push(`Common facilities: ${joinList(amenities)}.`);

  return paragraphs;
}

export function buildCityMetadata(city: string, slug: string, facts: CityFacts): Metadata {
  const title = `Student hostels in ${city}`;
  const count = facts.hostelCount === 1 ? "1 student hostel" : `${facts.hostelCount} student hostels`;
  const from = facts.minPrice > 0 ? ` from ${formatPkr(facts.minPrice)}/month` : "";
  const description = truncate(
    `Compare ${count} in ${city}${from}. Filter by area, price and reviews, then book online on HostelLo.`,
    MAX_DESCRIPTION_LENGTH,
  );
  const canonical = getCityCanonicalPath(slug);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", title, description, url: canonical, images: [SITE_SHARE_IMAGE] },
    twitter: { card: "summary", title, description, images: [SITE_SHARE_IMAGE.url] },
  };
}

/** Unknown cities must not be indexable. */
export function buildCityNotFoundMetadata(): Metadata {
  return { title: "City not found", robots: { index: false, follow: false } };
}

/** One row per slug, merging spellings. The most common spelling is the display name. */
export function groupCitySummaries(rows: readonly { city: string; count: number }[]): CitySummary[] {
  const bySlug = new Map<string, { city: string; count: number }[]>();
  for (const row of rows) {
    const slug = slugifyCity(row.city);
    if (!slug || slug.length > MAX_CITY_SLUG_LENGTH) continue;
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), row]);
  }
  return [...bySlug.entries()]
    .map(([slug, group]) => {
      const ordered = [...group].sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
      return {
        slug,
        name: ordered[0].city.trim(),
        spellings: ordered.map((row) => row.city),
        hostelCount: ordered.reduce((sum, row) => sum + row.count, 0),
      };
    })
    .sort((a, b) => b.hostelCount - a.hostelCount || a.name.localeCompare(b.name));
}

/** Cities with at least one active listing. One small grouped query, no hostel rows. */
export async function getCitySummaries(): Promise<CitySummary[]> {
  const rows = await db.hostel.groupBy({
    by: ["city"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
  });
  return groupCitySummaries(rows.map((row) => ({ city: row.city, count: row._count._all })));
}

/** Null for unknown or empty cities. Accepts any casing: the page redirects to the canonical slug. */
export async function getCityPage(param: string): Promise<CityPage | null> {
  if (!isBoundedRouteParam(param, MAX_CITY_SLUG_LENGTH)) return null;
  const slug = slugifyCity(param);
  if (!slug) return null;

  const summaries = await getCitySummaries();
  const city = summaries.find((summary) => summary.slug === slug);
  if (!city) return null;

  const hostels = await db.hostel.findMany({
    where: { status: "ACTIVE", city: { in: city.spellings } },
    select: {
      id: true,
      slug: true,
      name: true,
      area: true,
      gender: true,
      pricePerMonth: true,
      rating: true,
      reviewCount: true,
      verified: true,
      amenities: true,
      rooms_rel: { where: { capacity: { gt: 0 } }, select: { pricePerMonth: true } },
    },
    orderBy: [{ featured: "desc" }, { rating: "desc" }, { reviewCount: "desc" }, { id: "asc" }],
    take: MAX_CITY_PAGE_HOSTELS,
  });
  if (hostels.length === 0) return null;

  return {
    ...city,
    hostels,
    facts: buildCityFacts(hostels, city.hostelCount),
    relatedCities: summaries.filter((summary) => summary.slug !== slug).slice(0, MAX_RELATED_CITIES),
  };
}
