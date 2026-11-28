import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { HostelDetailGallery } from "./HostelDetailGallery";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

const baseProps = {
  initiallySaved: false,
  name: "Sample Hostel",
  slug: "sample-hostel",
};

describe("HostelDetailGallery", () => {
  it("announces the empty-photo message and omits the gallery dialog", () => {
    const markup = renderToStaticMarkup(
      <HostelDetailGallery {...baseProps} photos={[]} />,
    );

    expect(markup).toContain("grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]");
    expect(markup).toContain("grid-rows-[repeat(2,minmax(0,1fr))]");
    expect(markup).toContain(
      'aria-label="Photos are not available for this hostel yet."',
    );
    expect(markup).toContain("Photos are not available for this hostel yet.");
    expect(markup).not.toContain("Show all");
    expect(markup).not.toContain("<dialog");
  });

  it("limits the mosaic to five photos while retaining all photos in the dialog", () => {
    const photos = Array.from(
      { length: 6 },
      (_, index) => ({
        src: `/hostel-photo-${index + 1}.jpg`,
        alt: `Sample Hostel photo ${index + 1}`,
      }),
    );
    const markup = renderToStaticMarkup(
      <HostelDetailGallery {...baseProps} photos={photos} />,
    );

    expect(markup).toContain('data-photo-count="5"');
    expect(markup.match(/hostel-detail-photo relative/g)).toHaveLength(5);
    expect(markup).toContain("grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]");
    expect(markup).toContain("Show all 6 photos");
    expect(markup).toContain(">6 photos</h2>");
    expect(markup).toContain('alt="Sample Hostel photo 6"');
  });

  it("uses a single full-size photo tile when only one photo is available", () => {
    const markup = renderToStaticMarkup(
      <HostelDetailGallery
        {...baseProps}
        photos={[{ src: "/hostel-photo.jpg", alt: "Sample Hostel" }]}
      />,
    );

    expect(markup).toContain("col-span-full row-span-full");
    expect(markup).toContain("Show all 1 photo</button>");
    expect(markup).toContain(">1 photo</h2>");
  });

  it("renders a swipeable mobile gallery with photo count and listing actions", () => {
    const markup = renderToStaticMarkup(
      <HostelDetailGallery
        {...baseProps}
        photos={[
          { src: "/hostel-photo-1.jpg", alt: "Sample Hostel bedroom" },
          { src: "/hostel-photo-2.jpg", alt: "Sample Hostel lounge" },
        ]}
      />,
    );

    expect(markup).toContain('aria-label="Mobile hostel photo gallery"');
    expect(markup).toContain("snap-x");
    expect(markup).toContain("h-[45svh]");
    expect(markup).toContain("Photo 1 of 2");
    expect(markup).toContain("1 / 2");
    expect(markup).toContain('aria-label="Show all photos, 1 / 2"');
    expect(markup).toContain("bg-ink");
    expect(markup).not.toContain("bg-black/45");
    expect(markup).toContain('aria-label="Go back"');
    expect(markup).toContain('aria-label="Share Sample Hostel"');
    expect(markup).toContain('aria-label="Save Sample Hostel"');
    expect(markup).not.toContain("backdrop-blur");
    expect(markup).not.toContain("bg-white/55");
  });

  it.each([
    [2, "col-start-2 col-span-2 row-start-1 row-span-2"],
    [3, "col-start-2 col-span-2 row-start-2"],
    [4, "col-start-2 col-span-2 row-start-2"],
    [5, "col-start-3 row-start-2"],
  ])("positions the final tile in the %i-photo mosaic", (photoCount, classes) => {
    const photos = Array.from({ length: photoCount }, (_, index) => ({
      src: `/hostel-photo-${index + 1}.jpg`,
      alt: `Sample Hostel photo ${index + 1}`,
    }));
    const markup = renderToStaticMarkup(
      <HostelDetailGallery {...baseProps} photos={photos} />,
    );

    expect(markup).toContain(classes);
  });

  describe("image loading", () => {
    const photos = Array.from({ length: 6 }, (_, index) => ({
      src: `/hostel-photo-${index + 1}.jpg`,
      alt: `Sample Hostel photo ${index + 1}`,
    }));
    const markup = () => renderToStaticMarkup(<HostelDetailGallery {...baseProps} photos={photos} />);
    const sizesOf = (html: string) =>
      [...html.matchAll(/<img[^>]*\ssizes="([^"]*)"/g)].map((match) => match[1]);

    it("gives the desktop mosaic and the mobile carousel the same sizes, so a preload downloads one file", () => {
      const heroSizes = "(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 34vw";
      const all = sizesOf(markup());

      // 5 mosaic photos + 6 carousel photos use the hero string; the dialog has its own.
      expect(all.filter((sizes) => sizes === heroSizes)).toHaveLength(11);
      expect(all.filter((sizes) => sizes === "100vw")).toHaveLength(0);
    });

    it("tells the browser how wide the photos in the all-photos dialog are", () => {
      expect(sizesOf(markup()).filter((sizes) => sizes === "(max-width: 720px) 100vw, 50vw")).toHaveLength(6);
    });

    it("preloads the first photo once, not once per layout", () => {
      const preloads = markup().match(/<link[^>]*rel="preload"[^>]*as="image"[^>]*>/g) ?? [];
      // Identical srcset and sizes in both layouts: React keeps a single preload.
      expect(preloads).toHaveLength(1);
    });

    it("loads only the first photo of each layout eagerly", () => {
      const fillImages = markup().match(/<img[^>]*data-nimg="fill"[^>]*>/g) ?? [];
      const eager = fillImages.filter((tag) => !tag.includes('loading="lazy"'));

      // 5 mosaic + 6 carousel photos; one eager photo in each layout.
      expect(fillImages).toHaveLength(11);
      expect(eager).toHaveLength(2);
    });
  });
});
