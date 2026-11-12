import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, className, href }: { children: React.ReactNode; className?: string; href: string }) => (
    <a className={className} href={href}>
      {children}
    </a>
  ),
}));

import { CityLinks } from "./CityLinks";
import { HostelBreadcrumb } from "./HostelBreadcrumb";

describe("CityLinks", () => {
  it("renders crawlable links with descriptive anchor text and counts", () => {
    const html = renderToStaticMarkup(
      <CityLinks cities={[{ slug: "lahore", name: "Lahore", hostelCount: 20 }]} />,
    );
    expect(html).toContain('href="/hostels-in/lahore"');
    expect(html).toContain("Hostels in Lahore");
    expect(html).toContain("(20)");
    expect(html).toContain('aria-label="Browse student hostels by city"');
  });

  it("renders nothing without cities", () => {
    expect(renderToStaticMarkup(<CityLinks cities={[]} />)).toBe("");
  });
});

describe("HostelBreadcrumb", () => {
  it("links Home and the city page, and marks the hostel as the current page", () => {
    const html = renderToStaticMarkup(<HostelBreadcrumb city="Lahore" name="Green View Hostel" />);
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/hostels-in/lahore"');
    expect(html).toContain('aria-current="page">Green View Hostel');
  });

  it("falls back to search for cities without a landing page", () => {
    const html = renderToStaticMarkup(<HostelBreadcrumb city={"\u0644\u0627\u06c1\u0648\u0631"} name="X" />);
    expect(html).toContain("/search?city=");
  });
});
