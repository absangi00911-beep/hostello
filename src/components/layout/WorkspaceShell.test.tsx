import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WorkspaceShell, type WorkspaceNavigationItem } from "./WorkspaceShell";

const navigation: WorkspaceNavigationItem[] = [
  { href: "/owner", label: "Dashboard" },
  { href: "/owner/bookings", label: "Bookings" },
];

describe("WorkspaceShell", () => {
  it("renders only supplied destinations and marks the active page", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceShell
        activeHref="/owner/bookings"
        header={<header>HostelLo</header>}
        navigation={navigation}
      >
        <main id="main-content">
          <h1>Bookings</h1>
        </main>
      </WorkspaceShell>,
    );

    expect(markup).toContain('aria-label="Workspace navigation"');
    expect(markup).toContain('href="/owner">');
    expect(markup).toMatch(
      /<a\b(?=[^>]*href="\/owner\/bookings")(?=[^>]*aria-current="page")[^>]*>/,
    );
    expect(markup).toContain("HostelLo");
    expect(markup).toContain("<main id=\"main-content\">");
    expect(markup).not.toContain("Settings");
    expect(markup).not.toContain("Help Desk");
    expect(markup.match(/aria-current="page"/g)).toHaveLength(1);
  });

  it("leaves page gutters to children that already define their own width", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceShell
        activeHref="/owner"
        header={<header>HostelLo</header>}
        navigation={navigation}
      >
        <main>Page content</main>
      </WorkspaceShell>,
    );

    expect(markup).toContain('class="mx-auto grid w-full max-w-[1920px]');
    expect(markup).toContain("px-5");
    expect(markup).toContain("md:px-16");
    expect(markup).not.toContain(
      "w-[min(1920px,calc(100%-var(--page-gutter-mobile)))]",
    );
  });

  it("uses a visible wrapping mobile navigation instead of a clipped horizontal strip", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceShell
        activeHref="/owner"
        header={<header>HostelLo</header>}
        navigation={navigation}
      >
        <main>Page content</main>
      </WorkspaceShell>,
    );

    expect(markup).toContain("[@media(max-width:720px)]:grid");
    expect(markup).toContain("[@media(max-width:720px)]:grid-cols-2");
  });
});
