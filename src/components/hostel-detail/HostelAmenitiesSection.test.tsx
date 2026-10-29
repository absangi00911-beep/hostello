import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HostelAmenitiesSection } from "./HostelAmenitiesSection";

describe("HostelAmenitiesSection", () => {
  it("renders amenities in a responsive Tailwind grid", () => {
    const markup = renderToStaticMarkup(
      <HostelAmenitiesSection amenities={["Wi-Fi", "Meals", "CCTV"]} />,
    );

    expect(markup).toContain("grid grid-cols-2 gap-x-6");
    expect(markup).toContain("[@media(max-width:720px)]:grid-cols-1");
    expect(markup).toContain("border-b border-line");
    expect(markup).toContain("text-brand-dark");
    expect(markup).toContain("Wi-Fi");
    expect(markup).toContain("Meals");
    expect(markup).toContain("CCTV");
  });
});
