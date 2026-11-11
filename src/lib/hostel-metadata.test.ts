import { describe, expect, it } from "vitest";
import {
  buildHostelDescription,
  buildHostelMetadata,
  buildHostelNotFoundMetadata,
  getHostelCanonicalPath,
  type HostelMetadataInput,
} from "@/lib/hostel-metadata";

const hostel: HostelMetadataInput = {
  id: "h1",
  slug: "green-view-hostel",
  name: "Green View Hostel",
  city: "Lahore",
  area: "Gulberg",
  gender: "FEMALE",
  pricePerMonth: 12000,
  rating: 4.46,
  reviewCount: 12,
  amenities: ["WiFi", "Meals", "Laundry", "Gym"],
  coverImage: "https://cdn.example/cover.jpg",
  images: ["https://cdn.example/2.jpg"],
};

describe("hostel metadata", () => {
  it("builds a unique title and a facts-only description", () => {
    const metadata = buildHostelMetadata(hostel);
    expect(metadata.title).toBe("Green View Hostel in Gulberg, Lahore");
    expect(metadata.description).toBe(
      "Women\u2019s hostel in Gulberg, Lahore. Rooms from PKR 12,000/month. Rated 4.5/5 from 12 reviews. Includes WiFi, Meals, Laundry. Book online on HostelLo.",
    );
    expect(String(metadata.description).length).toBeLessThanOrEqual(160);
  });

  it("points the canonical URL at the slug, even when reached by id", () => {
    expect(buildHostelMetadata(hostel).alternates?.canonical).toBe("/hostels/green-view-hostel");
    expect(getHostelCanonicalPath({ id: "h1", slug: "" })).toBe("/hostels/h1");
    expect(getHostelCanonicalPath({ id: "h1", slug: "caf\u00e9 hostel" })).toBe(
      "/hostels/caf%C3%A9%20hostel",
    );
  });

  it("uses the cover photo for social previews", () => {
    const metadata = buildHostelMetadata(hostel);
    expect(metadata.openGraph).toMatchObject({
      url: "/hostels/green-view-hostel",
      images: [{ url: "https://cdn.example/cover.jpg", alt: "Green View Hostel" }],
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("falls back gracefully without area, photos, reviews or amenities", () => {
    const bare = { ...hostel, area: null, coverImage: null, images: [], reviewCount: 0, rating: null, amenities: [], gender: "ANY" };
    const metadata = buildHostelMetadata(bare);
    expect(metadata.title).toBe("Green View Hostel in Lahore");
    expect(metadata.description).toBe("Student hostel in Lahore. Rooms from PKR 12,000/month. Book online on HostelLo.");
    expect(metadata.twitter).toMatchObject({ card: "summary" });
    expect(metadata.openGraph).not.toHaveProperty("images");
  });

  it("truncates very long descriptions at a word boundary", () => {
    const long = buildHostelDescription({
      ...hostel,
      area: "A very long neighbourhood name that keeps going and going",
      amenities: ["Air conditioning in every single room", "Hot and cold filtered water", "Rooftop study lounge"],
    });
    expect(long.length).toBeLessThanOrEqual(160);
    expect(long.endsWith("\u2026")).toBe(true);
  });

  it("marks missing listings as noindex", () => {
    expect(buildHostelNotFoundMetadata()).toMatchObject({
      title: "Hostel not found",
      robots: { index: false, follow: false },
    });
  });

  it("quotes the cheapest room as the starting price", () => {
    const description = buildHostelDescription({
      ...hostel,
      pricePerMonth: 15000,
      rooms_rel: [{ pricePerMonth: 9000 }, { pricePerMonth: 20000 }],
    });
    expect(description).toContain("Rooms from PKR 9,000/month.");
  });
});
