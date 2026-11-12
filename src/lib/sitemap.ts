// Path: src/lib/sitemap.ts
import type { MetadataRoute } from "next";
import { isCityIndexable } from "@/lib/city-indexing";

/** Public, indexable pages that are not listings. Private areas stay out. */
export const STATIC_SITEMAP_PATHS = ["/", "/search", "/contact", "/terms", "/privacy"] as const;

/** A single sitemap file may hold at most 50,000 URLs (sitemaps.org protocol). */
export const MAX_SITEMAP_URLS = 50_000;

export interface SitemapHostel {
  slug: string;
  updatedAt: Date;
}

/** A city landing page (`/hostels-in/<slug>`); the slug is already URL-safe. */
export interface SitemapCity {
  slug: string;
  /** Active hostels in the city. Thin cities (see city-indexing) are left out. */
  hostelCount: number;
}

/** Pure builder: absolute URLs from the site origin, city pages and active listings. */
export function buildSitemapEntries(
  siteUrl: string | undefined,
  hostels: readonly SitemapHostel[],
  cities: readonly SitemapCity[] = [],
): MetadataRoute.Sitemap {
  if (!siteUrl) return [];

  const staticEntries: MetadataRoute.Sitemap = STATIC_SITEMAP_PATHS.map((path) => ({
    url: path === "/" ? siteUrl : `${siteUrl}${path}`,
  }));

  const cityEntries: MetadataRoute.Sitemap = cities
    .filter((city) => city.slug.length > 0 && isCityIndexable(city.hostelCount))
    .slice(0, MAX_SITEMAP_URLS - staticEntries.length)
    .map((city) => ({ url: `${siteUrl}/hostels-in/${city.slug}` }));

  const hostelEntries: MetadataRoute.Sitemap = hostels
    .filter((hostel) => hostel.slug.length > 0)
    .slice(0, MAX_SITEMAP_URLS - staticEntries.length - cityEntries.length)
    .map((hostel) => ({
      url: `${siteUrl}/hostels/${encodeURIComponent(hostel.slug)}`,
      lastModified: hostel.updatedAt,
    }));

  return [...staticEntries, ...cityEntries, ...hostelEntries];
}
