import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MAIN_CONTENT_ID, SkipLink } from "./SkipLink";

describe("SkipLink", () => {
  it("is a link to the main content that is hidden until it receives keyboard focus", () => {
    const markup = renderToStaticMarkup(<SkipLink />);

    expect(markup).toContain(`href="#${MAIN_CONTENT_ID}"`);
    expect(markup).toContain("Skip to main content");
    expect(markup).toContain("sr-only");
    expect(markup).toContain("focus-visible:not-sr-only");
  });
});
