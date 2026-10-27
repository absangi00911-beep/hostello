import { describe, expect, it } from "vitest";

import { getHostelGalleryPhotos } from "./hostel-gallery";

describe("getHostelGalleryPhotos", () => {
  it("orders listing photos before unique room photos with accurate alt text", () => {
    expect(
      getHostelGalleryPhotos(
        "Baloch Scholars Hostel",
        " cover.jpg ",
        ["cover.jpg", "gallery.jpg", "  "],
        [
          {
            name: "Triple Study Room",
            images: ["room.jpg", "gallery.jpg"],
          },
          { name: "Standard Double", images: ["double.jpg"] },
        ],
      ),
    ).toEqual([
      {
        src: "cover.jpg",
        alt: "Baloch Scholars Hostel photo 1",
      },
      {
        src: "gallery.jpg",
        alt: "Baloch Scholars Hostel photo 2",
      },
      {
        src: "room.jpg",
        alt: "Triple Study Room room photo for Baloch Scholars Hostel",
      },
      {
        src: "double.jpg",
        alt: "Standard Double room photo for Baloch Scholars Hostel",
      },
    ]);
  });

  it("returns no fabricated photos when a listing and its rooms have no images", () => {
    expect(
      getHostelGalleryPhotos("Sample Hostel", null, [" "], [
        { name: "Single Room", images: ["", "  "] },
      ]),
    ).toEqual([]);
  });
});
