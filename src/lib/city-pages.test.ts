import { beforeEach, describe, expect, it, vi } from "vitest";

const groupBy = vi.fn();
const findMany = vi.fn();
vi.mock("@/lib/db", () => ({
  db: {
    hostel: {
      groupBy: (...args: unknown[]) => groupBy(...args),
      findMany: (...args: unknown[]) => findMany(...args),
    },
  },
}));

import {
  buildCityFacts,
  buildCityIntro,
  buildCityMetadata,
  getCityPage,
  groupCitySummaries,
  slugifyCity,
  type CityHostel,
} from "@/lib/city-pages";

const hostel = (overrides: Partial<CityHostel> = {}): CityHostel => ({
  id: "h1",
  slug: "green-view",
  name: "Green View",
  area: "Gulberg",
  gender: "FEMALE",
  pricePerMonth: 12000,
  rating: 4.5,
  reviewCount: 3,
  verified: true,
  amenities: ["WiFi", "Meals"],
  ...overrides,
});

describe("slugifyCity", () => {
  it("collapses case, spacing and accents; drops names with no Latin letters", () => {
    expect(slugifyCity("Lahore")).toBe("lahore");
    expect(slugifyCity("  LAHORE ")).toBe("lahore");
    expect(slugifyCity("Dera Ghazi Khan")).toBe("dera-ghazi-khan");
    expect(slugifyCity("Caf\u00e9 City")).toBe("cafe-city");
    expect(slugifyCity("\u0644\u0627\u06c1\u0648\u0631")).toBe("");
  });
});

describe("buildCityFacts and buildCityIntro", () => {
  const hostels = [
    hostel(),
    hostel({ id: "h2", area: "gulberg", gender: "MALE", pricePerMonth: 8000, verified: false, amenities: ["WiFi"] }),
    hostel({ id: "h3", area: "DHA", gender: "MIXED", rooms_rel: [{ pricePerMonth: 6500 }], amenities: ["Gym"] }),
  ];

  it("summarises price range, areas, mix and amenities from real listings", () => {
    const facts = buildCityFacts(hostels);
    expect(facts).toMatchObject({
      hostelCount: 3,
      minPrice: 6500,
      maxPrice: 12000,
      verifiedCount: 2,
      areas: ["Gulberg", "DHA"],
      amenities: ["WiFi", "Gym", "Meals"],
      genders: { MALE: 1, FEMALE: 1, MIXED: 1 },
    });
  });

  it("writes copy from those facts, and uses the total when the list is capped", () => {
    const intro = buildCityIntro("Lahore", buildCityFacts(hostels, 140));
    expect(intro).toEqual([
      "140 student hostels are listed in Lahore on HostelLo. Monthly rent runs from PKR 6,500 to PKR 12,000.",
      "Popular areas include Gulberg and DHA. 2 verified listings.",
      "The mix is 1 men\u2019s, 1 women\u2019s and 1 mixed.",
      "Common facilities: WiFi, Gym and Meals.",
    ]);
  });

  it("stays sensible for a single bare listing", () => {
    const bare = hostel({ area: null, verified: false, amenities: [], pricePerMonth: 0, gender: "ANY" });
    expect(buildCityIntro("Quetta", buildCityFacts([bare]))).toEqual([
      "1 student hostel is listed in Quetta on HostelLo.",
      "The mix is 1 mixed.",
    ]);
  });
});

describe("buildCityMetadata", () => {
  it("sets a unique title, a canonical slug path and a bounded description", () => {
    const metadata = buildCityMetadata("Lahore", "lahore", buildCityFacts([hostel()]));
    expect(metadata.title).toBe("Student hostels in Lahore");
    expect(metadata.description).toBe(
      "Compare 1 student hostel in Lahore from PKR 12,000/month. Filter by area, price and reviews, then book online on HostelLo.",
    );
    expect(String(metadata.description).length).toBeLessThanOrEqual(160);
    expect(metadata.alternates?.canonical).toBe("/hostels-in/lahore");
  });
});

describe("groupCitySummaries", () => {
  it("merges spellings of one city and ignores unusable names", () => {
    const summaries = groupCitySummaries([
      { city: "Lahore", count: 5 },
      { city: "lahore ", count: 1 },
      { city: "Karachi", count: 7 },
      { city: "\u0644\u0627\u06c1\u0648\u0631", count: 2 },
    ]);
    expect(summaries).toEqual([
      { slug: "karachi", name: "Karachi", spellings: ["Karachi"], hostelCount: 7 },
      { slug: "lahore", name: "Lahore", spellings: ["Lahore", "lahore "], hostelCount: 6 },
    ]);
  });
});

describe("getCityPage", () => {
  beforeEach(() => {
    groupBy.mockReset();
    findMany.mockReset();
    groupBy.mockResolvedValue([
      { city: "Lahore", _count: { _all: 2 } },
      { city: "lahore ", _count: { _all: 1 } },
      { city: "Karachi", _count: { _all: 4 } },
    ]);
    findMany.mockResolvedValue([hostel()]);
  });

  it("finds a city by any casing and queries every spelling, active listings only", async () => {
    const page = await getCityPage("LAHORE");

    expect(page).toMatchObject({ slug: "lahore", name: "Lahore", hostelCount: 3 });
    expect(page?.relatedCities.map((city) => city.slug)).toEqual(["karachi"]);
    expect(findMany.mock.calls[0][0]).toMatchObject({
      where: { status: "ACTIVE", city: { in: ["Lahore", "lahore "] } },
      take: 100,
    });
  });

  it("returns null for unknown, empty or oversized input without touching the database", async () => {
    expect(await getCityPage("atlantis")).toBeNull();
    expect(findMany).not.toHaveBeenCalled();

    groupBy.mockClear();
    expect(await getCityPage("***")).toBeNull();
    expect(await getCityPage("a".repeat(61))).toBeNull();
    expect(groupBy).not.toHaveBeenCalled();
  });

  it("returns null when the city has no active listings left", async () => {
    findMany.mockResolvedValue([]);
    expect(await getCityPage("lahore")).toBeNull();
  });
});
