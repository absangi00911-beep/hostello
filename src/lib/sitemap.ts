// Path: src/lib/sitemap.ts
import type { MetadataRoute } from "next";

/** Public, indexable pages that are not listings. Private areas stay out. */
export const STATIC_SITEMAP_PATHS = ["/", "/search", "/contact", "/terms", "/privacy"] as const;

/** A single sitemap file may hold at most 50,000 URLs (sitemaps.org protocol). */
export const MAX_SITEMAP_URLS = 50_000;

export interface SitemapHostel {
  slug: string;
  updatedAt: Date;
}

/** Pure builder: absolute URLs from the site origin plus active listings. */
export function buildSitemapEntries(
  siteUrl: string | undefined,
  hostels: readonly SitemapHostel[],
): MetadataRoute.Sitemap {
  if (!siteUrl) return [];

  const staticEntries: MetadataRoute.Sitemap = STATIC_SITEMAP_PATHS.map((path) => ({
    url: path === "/" ? siteUrl : `${siteUrl}${path}`,
  }));

  const hostelEntries: MetadataRoute.Sitemap = hostels
    .filter((hostel) => hostel.slug.length > 0)
    .slice(0, MAX_SITEMAP_URLS - staticEntries.length)
    .map((hostel) => ({
      url: `${siteUrl}/hostels/${encodeURIComponent(hostel.slug)}`,
      lastModified: hostel.updatedAt,
    }));

  return [...staticEntries, ...hostelEntries];
}
