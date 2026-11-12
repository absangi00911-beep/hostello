import { beforeEach, describe, expect, it, vi } from "vitest";

const getHostelShareCard = vi.hoisted(() => vi.fn());
vi.mock("@/lib/hostel-share-card", () => ({ getHostelShareCard }));

import Image from "./opengraph-image";

const params = (param: string) => ({ params: Promise.resolve({ param }) });
const card = {
  name: "Green View Hostel",
  location: "Gulberg, Lahore",
  genderLabel: "Women\u2019s hostel",
  priceLabel: "From PKR 9,500/month",
  ratingLabel: null,
};

beforeEach(() => {
  getHostelShareCard.mockReset();
});

describe("hostel opengraph image route", () => {
  it("caches a found listing for an hour", async () => {
    getHostelShareCard.mockResolvedValue(card);
    const response = await Image(params("green-view"));
    expect(response.headers.get("cache-control")).toContain("s-maxage=3600");
  });

  it("caches the fallback for an unknown hostel only briefly", async () => {
    getHostelShareCard.mockResolvedValue(null);
    const response = await Image(params("nope"));
    expect(response.headers.get("cache-control")).toBe("public, max-age=0, s-maxage=300");
  });

  it("returns an uncached branded image when the database lookup fails", async () => {
    getHostelShareCard.mockRejectedValue(new Error("db down"));
    const response = await Image(params("green-view"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
