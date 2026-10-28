import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { HostelSearchBar } from "./HostelSearchBar";

describe("HostelSearchBar", () => {
  it("renders a mobile search trigger and a full-screen search dialog", () => {
    const markup = renderToStaticMarkup(
      <HostelSearchBar onSearch={vi.fn()} />,
    );

    expect(markup).toContain('aria-label="Start your search"');
    expect(markup).toContain('aria-label="Search stays"');
    expect(markup).toContain('class="browse-search-dialog"');
  });

  it("keeps the existing search fields in the desktop and mobile surfaces", () => {
    const markup = renderToStaticMarkup(
      <HostelSearchBar onSearch={vi.fn()} />,
    );

    expect(markup.match(/aria-label="Destination"/g)).toHaveLength(2);
    expect(markup.match(/aria-label="Move-in date"/g)).toHaveLength(2);
    expect(markup.match(/aria-label="Guests"/g)).toHaveLength(2);
    expect(markup.match(/aria-label="Search hostels"/g)).toHaveLength(2);
    expect(markup).toContain(
      "Move-in date and guests aren&#x27;t used to filter availability yet.",
    );
  });
});
