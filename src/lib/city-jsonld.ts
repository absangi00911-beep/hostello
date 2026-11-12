// Path: src/lib/city-jsonld.ts
import { getCityCanonicalPath } from "@/lib/city-pages";
import type { CityPage } from "@/lib/city-pages";

/** schema.org breadcrumb and hostel list for a city landing page. */
export function buildCityJsonLd(
  city: Pick<CityPage, "slug" | "name" | "hostels">,
  siteUrl: string | undefined,
) {
  if (!siteUrl) return null;

  const url = `${siteUrl}${getCityCanonicalPath(city.slug)}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: `Hostels in ${city.name}`, item: url },
        ],
      },
      {
        "@type": "ItemList",
        name: `Student hostels in ${city.name}`,
        url,
        numberOfItems: city.hostels.length,
        itemListElement: city.hostels.map((hostel, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: hostel.name,
          url: `${siteUrl}/hostels/${encodeURIComponent(hostel.slug)}`,
        })),
      },
    ],
  };
}
