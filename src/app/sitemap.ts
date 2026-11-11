import type { MetadataRoute } from "next";
import { getCitySummaries } from "@/lib/city-pages";
import { db } from "@/lib/db";
import { logOperationalEvent } from "@/lib/operational-logger";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { getSiteUrl } from "@/lib/site-metadata";
import {
  MAX_SITEMAP_URLS,
  buildSitemapEntries,
  type SitemapCity,
  type SitemapHostel,
} from "@/lib/sitemap";

// Read the database per request (and cache at the CDN), not at build time, so
// a build without database access still succeeds and new listings appear.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  if (!siteUrl) return [];

  let hostels: SitemapHostel[] = [];
  try {
    hostels = await db.hostel.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: MAX_SITEMAP_URLS,
    });
  } catch (error) {
    // Serve the static pages rather than a 500, which crawlers treat as an outage.
    const summary = getSafeErrorSummary(error);
    logOperationalEvent("warn", "sitemap.hostel_query_failed", {
      error_name: summary.name,
      error_code: summary.code ?? null,
    });
  }

  // A separate try so a failing city query cannot drop the hostel URLs, or the reverse.
  let cities: SitemapCity[] = [];
  try {
    cities = await getCitySummaries();
  } catch (error) {
    const summary = getSafeErrorSummary(error);
    logOperationalEvent("warn", "sitemap.city_query_failed", {
      error_name: summary.name,
      error_code: summary.code ?? null,
    });
  }

  return buildSitemapEntries(siteUrl, hostels, cities);
}
