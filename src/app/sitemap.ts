// Path: src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import { CITIES } from "@hostello/shared";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const APP_URL = getAppUrl();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL,            lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${APP_URL}/hostels`, lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${APP_URL}/login`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${APP_URL}/signup`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  // City landing pages — one per city
  const cityRoutes: MetadataRoute.Sitemap = CITIES.map((city) => ({
    url:             `${APP_URL}/hostels/in/${city.toLowerCase()}`,
    lastModified:    new Date(),
    changeFrequency: "weekly",
    priority:        0.85,
  }));

  // Active hostel detail pages
  let hostelRoutes: MetadataRoute.Sitemap = [];
  try {
    const hostels = await db.hostel.findMany({
      where:   { status: "ACTIVE" },
      select:  { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    hostelRoutes = hostels.map((h) => ({
      url:             `${APP_URL}/hostels/${h.slug}`,
      lastModified:    h.updatedAt,
      changeFrequency: "weekly",
      priority:        0.7,
    }));
  } catch {
    // Non-fatal — sitemap still returns static + city routes
    console.error("[sitemap] Failed to fetch hostel slugs");
  }

  return [...staticRoutes, ...cityRoutes, ...hostelRoutes];
}