import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getProductNavigationTabs } from "@/lib/product-navigation";
import { MobileTabNavigation } from "./MobileTabNavigation";

const tabs = [
  { id: "explore", label: "Explore", href: "/" },
  { id: "wishlists", label: "Wishlists", href: "/wishlists" },
  { id: "trips", label: "Trips", href: "/trips" },
  { id: "messages", label: "Messages", href: "/messages" },
  { id: "profile", label: "Profile", href: "/profile" },
] as const;

describe("MobileTabNavigation", () => {
  it("uses Tailwind for mobile visibility and safe-area layout", () => {
    const markup = renderToStaticMarkup(
      <MobileTabNavigation activeTab="explore" role="STUDENT" />,
    );

    expect(markup).toContain("fixed");
    expect(markup).toContain("grid-cols-5");
    expect(markup).toContain("pb-[calc(6px+env(safe-area-inset-bottom))]");
    expect(markup).toContain("[@media(max-width:720px)]:grid");
    expect(markup).toContain('data-scrolled="false"');
    expect(markup).not.toContain("border-t");
    expect(markup).not.toContain("shadow-[");
    expect(markup).not.toContain("mobile-tab-navigation");
  });

  it("renders all five tab links with their labels and destinations", () => {
    const markup = renderToStaticMarkup(
      <MobileTabNavigation activeTab="explore" role="STUDENT" />,
    );

    for (const tab of tabs) {
      expect(markup).toContain(`href="${tab.href}"`);
      expect(markup).toContain(`<span>${tab.label}</span>`);
    }
  });

  it("hides Trips and Messages from unauthenticated users", () => {
    const markup = renderToStaticMarkup(
      <MobileTabNavigation activeTab="explore" role={null} />,
    );

    expect(markup).toContain('href="/"');
    expect(markup).toContain('href="/wishlists"');
    expect(markup).toContain('href="/profile"');
    expect(markup).not.toContain('href="/trips"');
    expect(markup).not.toContain('href="/messages"');
    expect(markup).toContain('aria-label="Main navigation"');
    expect(markup).toContain("grid-cols-3");
  });

  it("marks only the active tab as the current page", () => {
    for (const tab of tabs) {
      const markup = renderToStaticMarkup(
        <MobileTabNavigation activeTab={tab.id} role="STUDENT" />,
      );

      expect(markup.match(/aria-current="page"/g)).toHaveLength(1);
      const activeLink = markup.match(
        /<a\b(?=[^>]*aria-current="page")[^>]*>/,
      )?.[0];
      expect(activeLink).toContain(`href="${tab.href}"`);
    }
  });

  it.each([
    ["STUDENT", ["explore", "wishlists", "trips", "messages", "profile"]],
    ["OWNER", ["explore", "messages"]],
    ["ADMIN", ["explore"]],
    [null, ["explore", "wishlists", "profile"]],
  ] as const)("returns role-available destinations for %s", (role, expected) => {
    expect(getProductNavigationTabs(role).map((tab) => tab.id)).toEqual(
      expected,
    );
  });
});
