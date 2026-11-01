import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ScrollAwareSurface } from "./ScrollAwareSurface";

describe("ScrollAwareSurface", () => {
  it("renders the requested semantic element without a scroll shadow initially", () => {
    const markup = renderToStaticMarkup(
      <ScrollAwareSurface
        as="header"
        className="sticky top-0 bg-white"
        scrolledClassName="shadow-[0_4px_12px_rgb(0_0_0_/_8%)]"
      >
        Page header
      </ScrollAwareSurface>,
    );

    expect(markup).toContain(
      'class="sticky top-0 bg-white transition-shadow duration-200 motion-reduce:transition-none" data-scrolled="false"',
    );
    expect(markup).toContain(">Page header</header>");
    expect(markup).not.toContain("shadow-[");
  });
});
