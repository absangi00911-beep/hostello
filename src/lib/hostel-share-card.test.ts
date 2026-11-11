import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirst = vi.fn();
vi.mock("@/lib/db", () => ({ db: { hostel: { findFirst: (...args: unknown[]) => findFirst(...args) } } }));

vi.mock("@/lib/hostel-service", () => ({
  hostelIdOrSlugWhere: (param: string) => ({ OR: [{ id: param }, { slug: param }] }),
}));

import {
  buildHostelShareCard,
  getHostelShareCard,
  type HostelShareCardInput,
} from "@/lib/hostel-share-card";

const hostel: HostelShareCardInput = {
  name: "Green View Hostel",
  city: "Lahore",
  area: "Gulberg",
  gender: "FEMALE",
  pricePerMonth: 12000,
  rating: 4.46,
  reviewCount: 12,
  rooms_rel: [{ pricePerMonth: 9500 }],
};

describe("buildHostelShareCard", () => {
  it("shows location, gender, cheapest price and rating", () => {
    expect(buildHostelShareCard(hostel)).toEqual({
      name: "Green View Hostel",
      location: "Gulberg, Lahore",
      genderLabel: "Women\u2019s hostel",
      priceLabel: "From PKR 9,500/month",
      ratingLabel: "4.5/5 \u00b7 12 reviews",
    });
  });

  it("omits price and rating when there is nothing to show", () => {
    const card = buildHostelShareCard({
      ...hostel,
      area: null,
      gender: "ANY",
      pricePerMonth: 0,
      rooms_rel: [],
      rating: null,
      reviewCount: 0,
    });
    expect(card).toMatchObject({
      location: "Lahore",
      genderLabel: "Student hostel",
      priceLabel: null,
      ratingLabel: null,
    });
  });

  it("uses the singular for one review and clips very long names", () => {
    const card = buildHostelShareCard({ ...hostel, reviewCount: 1, name: "A".repeat(200) });
    expect(card.ratingLabel).toBe("4.5/5 \u00b7 1 review");
    expect(card.name).toHaveLength(70);
    expect(card.name.endsWith("\u2026")).toBe(true);
  });
});

describe("getHostelShareCard", () => {
  beforeEach(() => findFirst.mockReset());

  it("only looks up ACTIVE listings and selects lightweight fields", async () => {
    findFirst.mockResolvedValue(hostel);
    const card = await getHostelShareCard("green-view-hostel");
    expect(card?.name).toBe("Green View Hostel");
    const query = findFirst.mock.calls[0][0];
    expect(query.where.status).toBe("ACTIVE");
    expect(query.select).not.toHaveProperty("owner");
    expect(query.select).not.toHaveProperty("reviews");
  });

  it("returns null for a missing listing without throwing", async () => {
    findFirst.mockResolvedValue(null);
    expect(await getHostelShareCard("nope")).toBeNull();
  });

  it("rejects oversized params before touching the database", async () => {
    expect(await getHostelShareCard("x".repeat(500))).toBeNull();
    expect(findFirst).not.toHaveBeenCalled();
  });
});
