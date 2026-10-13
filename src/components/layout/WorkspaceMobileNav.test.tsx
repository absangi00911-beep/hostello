import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LayoutDashboard, MessageCircle } from "lucide-react";
import { WorkspaceMobileNav } from "./WorkspaceMobileNav";

const mocks = vi.hoisted(() => ({ pathname: "/owner/dashboard" }));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("WorkspaceMobileNav", () => {
  it("provides workspace links in a collapsible top navigation menu", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceMobileNav
        label="Owner"
        items={[
          { href: "/owner/dashboard", label: "Overview", icon: LayoutDashboard },
          { href: "/owner/messages", label: "Messages", icon: MessageCircle },
        ]}
      />,
    );

    expect(markup).toContain('aria-label="Open owner navigation"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('href="/owner/dashboard"');
    expect(markup).toContain('href="/owner/messages"');
    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain('href="/"');
    expect(markup).not.toContain("fixed bottom-0");
  });
});
