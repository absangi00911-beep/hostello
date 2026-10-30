import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HostelDetailGallery } from "./HostelDetailGallery";

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
});
