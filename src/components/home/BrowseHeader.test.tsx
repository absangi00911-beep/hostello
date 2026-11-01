import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
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

    expect(markup).toMatch(/<header class="bg-\[#fcfcfb\]/);
    expect(markup).toContain('alt="Hostello logo"');
    expect(markup).toContain("<span>hostello</span>");
  });
});
