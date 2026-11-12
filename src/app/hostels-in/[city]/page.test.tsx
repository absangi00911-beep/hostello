import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), getCityPage: vi.fn() }));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  permanentRedirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/components/auth/BrowseAccountMenu", () => ({ BrowseAccountMenu: () => null }));
vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/city-pages", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/city-pages")>()),
  getCityPage: mocks.getCityPage,
}));

import { buildCityFacts } from "@/lib/city-pages";
import CityHostelsPage, { generateMetadata } from "./page";

const hostels = [
  {
    id: "h1",
    slug: "green-view",
    name: "Green View",
    area: "Gulberg",
    gender: "FEMALE",
    pricePerMonth: 12000,
    rating: 4.5,
    reviewCount: 3,
    verified: true,
    amenities: ["WiFi"],
  },
];
const city = {
  slug: "lahore",
  name: "Lahore",
  spellings: ["Lahore"],
  hostelCount: 1,
  hostels,
  facts: buildCityFacts(hostels),
  relatedCities: [{ slug: "karachi", name: "Karachi", spellings: ["Karachi"], hostelCount: 4 }],
};
const params = (value: string) => ({ params: Promise.resolve({ city: value }) });

describe("CityHostelsPage", () => {
  beforeEach(() => {
    mocks.auth.mockResolvedValue(null);
    mocks.getCityPage.mockResolvedValue(city);
  });

  it("renders crawlable links to hostels, the filtered search and other cities", async () => {
    const markup = renderToStaticMarkup(await CityHostelsPage(params("lahore")));

    expect(markup).toContain("<h1");
    expect(markup).toContain("Student hostels in Lahore");
    expect(markup).toContain('href="/hostels/green-view"');
    expect(markup).toContain("From PKR 12,000/month");
    expect(markup).toContain('href="/search?city=Lahore"');
    expect(markup).toContain('href="/hostels-in/karachi"');
  });

  it("answers 404 for an unknown city", async () => {
    mocks.getCityPage.mockResolvedValue(null);
    await expect(CityHostelsPage(params("atlantis"))).rejects.toThrow("NEXT_NOT_FOUND");
    expect((await generateMetadata(params("atlantis"))).robots).toMatchObject({ index: false });
  });

  it("permanently redirects non-canonical spellings to the slug", async () => {
    await expect(CityHostelsPage(params("Lahore"))).rejects.toThrow("REDIRECT:/hostels-in/lahore");
  });

  it("sets canonical metadata from the city slug", async () => {
    const metadata = await generateMetadata(params("lahore"));
    expect(metadata.title).toBe("Student hostels in Lahore");
    expect(metadata.alternates?.canonical).toBe("/hostels-in/lahore");
  });

  it("embeds breadcrumb and hostel-list structured data", async () => {
    const tree = JSON.stringify(await CityHostelsPage(params("lahore")));

    expect(tree).toContain('"@type":"ItemList"');
    expect(tree).toContain('"@type":"BreadcrumbList"');
    expect(tree).toContain("/hostels/green-view");
  });
});
