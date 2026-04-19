import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/app-url";

const BASE_URL = getAppUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/hostels", "/hostels/"],
        disallow: [
          "/api/",
          "/dashboard/",
          "/bookings/",
          "/favorites/",
          "/profile/",
          "/login",
          "/signup",
          "/forgot-password",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
