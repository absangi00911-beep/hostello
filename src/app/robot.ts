// Path: src/app/robots.ts
import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  const APP_URL = getAppUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/owner/",
          "/dashboard/",
          "/profile/",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}