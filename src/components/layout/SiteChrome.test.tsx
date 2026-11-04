import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    className,
    href,
  }: {
    children: React.ReactNode;
    className?: string;
    href: string;
  }) => (
    <a className={className} href={href}>
      {children}
    </a>
  ),
}));
vi.mock("@/components/auth/BrowseAccountMenu", () => ({
  BrowseAccountMenu: () => <div data-testid="account-menu" />,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

describe("SiteFooter", () => {
  const markup = renderToStaticMarkup(<SiteFooter />);

  it("links to the existing Terms, Privacy and Contact pages", () => {
    expect(markup).toContain('href="/terms"');
    expect(markup).toContain('href="/privacy"');
    expect(markup).toContain('href="/contact"');
  });

  it("does not link to the missing /help page", () => {
    expect(markup).not.toContain("/help");
  });

  it("is a labelled landmark with 44px link targets", () => {
    expect(markup).toContain("<footer");
    expect(markup).toContain('aria-label="Site"');
    expect(markup.match(/min-h-11/g)?.length).toBe(3);
  });

  it("contains no legal text", () => {
    expect(markup).not.toMatch(/liability|governing law|agree/i);
  });
});

describe("SiteHeader", () => {
  it("renders brand and account menu for a guest", () => {
    const markup = renderToStaticMarkup(<SiteHeader user={null} />);

    expect(markup).toContain("<header");
    expect(markup).toContain('href="/"');
    expect(markup).toContain("hostello");
    expect(markup).toContain("account-menu");
  });

  it("hides on phones by default but stays when hideOnMobile is false", () => {
    const hidden = renderToStaticMarkup(<SiteHeader user={null} />);
    const shown = renderToStaticMarkup(
      <SiteHeader hideOnMobile={false} user={null} />,
    );

    expect(hidden.match(/<header\b[^>]*>/)?.[0]).toContain("max-width:720px");
    expect(shown.match(/<header\b[^>]*>/)?.[0]).not.toContain("max-width:720px");
  });

  it("renders a center slot when given one", () => {
    const markup = renderToStaticMarkup(
      <SiteHeader center={<nav aria-label="Categories" />} user={null} />,
    );

    expect(markup).toContain('aria-label="Categories"');
  });
});
