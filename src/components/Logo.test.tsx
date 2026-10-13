import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("renders the HostelLo wordmark and the doorway mark", () => {
    const markup = renderToStaticMarkup(<Logo />);

    expect(markup).toContain('href="/"');
    expect(markup).toContain("Hostel");
    expect(markup).toContain(">Lo</span>");
    expect(markup).toContain('viewBox="0 0 36 36"');
    expect(markup).toContain("fill-rule");
  });

  it("keeps the compact mark and custom destination", () => {
    const markup = renderToStaticMarkup(<Logo size="compact" href="/home" />);

    expect(markup).toContain('href="/home"');
    expect(markup).toContain('width="28"');
    expect(markup).toContain('height="28"');
  });
});
