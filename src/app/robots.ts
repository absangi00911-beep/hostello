import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-metadata";

/** Private, transactional and account areas that should never be crawled. */
export const DISALLOWED_PATHS = [
  "/api/",
  "/admin",
  "/owner",
  "/booking/",
  "/bookings",
  "/profile",
  "/messages",
  "/notifications",
  "/student",
  "/trips",
  "/wishlists",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: DISALLOWED_PATHS }],
    ...(siteUrl ? { sitemap: `${siteUrl}/sitemap.xml`, host: siteUrl } : {}),
  };
}
