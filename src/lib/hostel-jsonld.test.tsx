import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildHostelJsonLd, type HostelJsonLdInput } from "@/lib/hostel-jsonld";

const SITE = "https://hostello.example";

const hostel: HostelJsonLdInput = {
  id: "h1",
  slug: "green-view-hostel",
  name: "Green View Hostel",
  city: "Lahore",
  area: "Gulberg",
  gender: "FEMALE",
  description: "Quiet   hostel\nnear campus.",
  pricePerMonth: 15000,
  rooms: 12,
  rating: 4.456,
  reviewCount: 12,
  amenities: ["WiFi", " ", "Meals"],
  coverImage: "https://cdn.example/cover.jpg",
  images: ["/uploads/2.jpg", "relative-without-slash.jpg"],
  rooms_rel: [{ pricePerMonth: 12000 }, { pricePerMonth: 18000 }],
  latitude: 31.52,
  longitude: 74.35,
};

type Graph = { "@graph": Record<string, unknown>[] };

describe("buildHostelJsonLd", () => {
  it("returns nothing without a site URL", () => {
    expect(buildHostelJsonLd(hostel, undefined)).toBeNull();
  });

  it("describes the hostel with only visible, public facts", () => {
    const data = buildHostelJsonLd(hostel, SITE) as Graph;
    const lodging = data["@graph"][0];

    expect(lodging).toMatchObject({
      "@type": "Hostel",
      url: `${SITE}/hostels/green-view-hostel`,
      name: "Green View Hostel",
      description: "Quiet hostel near campus.",
      address: { addressLocality: "Lahore", addressCountry: "PK" },
      geo: { latitude: 31.52, longitude: 74.35 },
      priceRange: "PKR 12,000+ per month",
      numberOfRooms: 12,
      aggregateRating: { ratingValue: 4.46, reviewCount: 12, bestRating: 5 },
    });
    expect(lodging.image).toEqual(["https://cdn.example/cover.jpg", `${SITE}/uploads/2.jpg`]);
    expect(lodging.amenityFeature).toHaveLength(2);
    expect(JSON.stringify(lodging)).not.toMatch(/telephone|email|owner/i);
  });

  it("omits the rating when there are no reviews and coordinates when unknown", () => {
    const lodging = (
      buildHostelJsonLd({ ...hostel, reviewCount: 0, rating: null, latitude: null, longitude: null }, SITE) as Graph
    )["@graph"][0];
    expect(lodging).not.toHaveProperty("aggregateRating");
    expect(lodging).not.toHaveProperty("geo");
  });

  it("adds a three-level breadcrumb trail", () => {
    const breadcrumbs = (buildHostelJsonLd(hostel, SITE) as Graph)["@graph"][1];
    const items = breadcrumbs.itemListElement as { position: number; name: string; item: string }[];
    expect(items.map((item) => [item.position, item.name])).toEqual([
      [1, "Home"],
      [2, "Hostels in Lahore"],
      [3, "Green View Hostel"],
    ]);
    expect(items[1].item).toBe(`${SITE}/hostels-in/lahore`);
  });
});

describe("breadcrumb for cities without a landing page", () => {
  it("falls back to filtered search", () => {
    const breadcrumbs = (buildHostelJsonLd({ ...hostel, city: "\u0644\u0627\u06c1\u0648\u0631" }, SITE) as Graph)["@graph"][1];
    const items = breadcrumbs.itemListElement as { item: string }[];
    expect(items[1].item).toContain("/search?city=");
  });
});

describe("JsonLd component", () => {
  it("cannot be broken out of by hostile text", () => {
    const html = renderToStaticMarkup(<JsonLd data={{ name: "</script><script>alert(1)</script>" }} />);
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    expect(html).toContain("\\u003c/script>");
  });
});
