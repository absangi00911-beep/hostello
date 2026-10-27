import { describe, expect, it } from "vitest";
import {
  formatHostelAmenity,
  getHostelMapEmbedUrl,
  getHostelGalleryImages,
} from "./hostel-detail-presentation";

describe("getHostelGalleryImages", () => {
  it("puts the cover first and removes duplicates without losing full-gallery photos", () => {
    expect(
      getHostelGalleryImages("cover.jpg", [
        "cover.jpg",
        "one.jpg",
        "two.jpg",
        "three.jpg",
        "four.jpg",
        "five.jpg",
      ]),
    ).toEqual([
      "cover.jpg",
      "one.jpg",
      "two.jpg",
      "three.jpg",
      "four.jpg",
      "five.jpg",
    ]);
  });

  it("returns no fabricated photos when a listing has no images", () => {
    expect(getHostelGalleryImages(null, [])).toEqual([]);
  });
});

describe("formatHostelAmenity", () => {
  it("turns listing amenity keys into readable labels", () => {
    expect(formatHostelAmenity("study-room")).toBe("Study room");
    expect(formatHostelAmenity("water_cooler")).toBe("Water cooler");
  });

  it("preserves common abbreviations", () => {
    expect(formatHostelAmenity("wifi")).toBe("Wi-Fi");
    expect(formatHostelAmenity("Wi-Fi")).toBe("Wi-Fi");
    expect(formatHostelAmenity("cctv")).toBe("CCTV");
  });

  it("omits whitespace-only values", () => {
    expect(formatHostelAmenity("   ")).toBe("");
  });
});

describe("getHostelMapEmbedUrl", () => {
  it("rounds coordinates to an approximate area before embedding them", () => {
    const url = getHostelMapEmbedUrl(30.1798, 67.0099);

    expect(url).toContain("https://www.openstreetmap.org/export/embed.html?");
    expect(url).toContain("marker=30.18%2C67.01");
    expect(url).not.toContain("30.1798");
    expect(url).not.toContain("67.0099");
  });

  it("omits map embeds when coordinates are missing or outside valid ranges", () => {
    expect(getHostelMapEmbedUrl(null, 67.0099)).toBeNull();
    expect(getHostelMapEmbedUrl(30.1798, null)).toBeNull();
    expect(getHostelMapEmbedUrl(91, 67.0099)).toBeNull();
    expect(getHostelMapEmbedUrl(30.1798, 181)).toBeNull();
    expect(getHostelMapEmbedUrl(Number.NaN, 67.0099)).toBeNull();
  });
});
