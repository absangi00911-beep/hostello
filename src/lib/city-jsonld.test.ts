import { describe, expect, it } from "vitest";
import { buildCityJsonLd } from "@/lib/city-jsonld";

const SITE = "https://hostello.example";
const city = {
  slug: "lahore",
  name: "Lahore",
  hostels: [
    { slug: "green-view", name: "Green View" },
    { slug: "caf\u00e9 hostel", name: "Caf\u00e9 Hostel" },
  ],
} as Parameters<typeof buildCityJsonLd>[0];

type Graph = { "@graph": Record<string, unknown>[] };

describe("buildCityJsonLd", () => {
  it("returns nothing without a site URL", () => {
    expect(buildCityJsonLd(city, undefined)).toBeNull();
  });

  it("describes the breadcrumb and the hostel list", () => {
    const [breadcrumbs, list] = (buildCityJsonLd(city, SITE) as Graph)["@graph"];

    expect(breadcrumbs.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Hostels in Lahore", item: `${SITE}/hostels-in/lahore` },
    ]);
    expect(list).toMatchObject({
      "@type": "ItemList",
      name: "Student hostels in Lahore",
      numberOfItems: 2,
    });
    expect(list.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Green View", url: `${SITE}/hostels/green-view` },
      { "@type": "ListItem", position: 2, name: "Caf\u00e9 Hostel", url: `${SITE}/hostels/caf%C3%A9%20hostel` },
    ]);
  });
});
