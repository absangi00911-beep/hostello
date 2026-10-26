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
      (_, index) => `/hostel-photo-${index + 1}.jpg`,
    );
    const markup = renderToStaticMarkup(
      <HostelDetailGallery {...baseProps} photos={photos} />,
    );

    expect(markup).toContain('data-photo-count="5"');
    expect(markup.match(/class="hostel-detail-photo"/g)).toHaveLength(5);
    expect(markup).toContain("Show all 6 photos");
    expect(markup).toContain('alt="Sample Hostel photo 6"');
  });
});
