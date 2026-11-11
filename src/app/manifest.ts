import type { MetadataRoute } from "next";
import { APP_NAME } from "@/config/constants";
import { SITE_DESCRIPTION } from "@/lib/site-metadata";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} | Student hostels in Pakistan`,
    short_name: APP_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "en",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
