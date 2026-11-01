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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/auth/BrowseAccountActions", () => ({
  BrowseAccountActions: () => null,
}));

import { BrowseHeader } from "./BrowseHeader";

describe("BrowseHeader", () => {
  it("matches the search band's full-width background", () => {
    const markup = renderToStaticMarkup(
      <BrowseHeader
        accountUser={null}
        category="all"
        onSelectCategory={vi.fn()}
      />,
    );

    const header = markup.match(/<header\b[^>]*>/)?.[0];
    expect(header).toMatch(
      /<header class="bg-\[#fcfcfb\].*sticky top-0 z-30[^"]*" data-scrolled="false">/,
    );
    expect(header).not.toContain("border-b");
    expect(markup).toContain('alt="Hostello logo"');
    expect(markup).toContain("<span>hostello</span>");
  });

  it("hides the brand on mobile when the owner header remains visible", () => {
    const markup = renderToStaticMarkup(
      <BrowseHeader
        accountUser={{ role: "OWNER" }}
        category="all"
        onSelectCategory={vi.fn()}
      />,
    );

    expect(markup).toMatch(
      /<a class="[^"]*\[@media\(max-width:720px\)\]:hidden[^"]*" href="\/"/,
    );
  });
});
