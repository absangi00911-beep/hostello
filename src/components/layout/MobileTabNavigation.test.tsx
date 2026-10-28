import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MobileTabNavigation } from "./MobileTabNavigation";

const tabs = [
  { id: "explore", label: "Explore", href: "/" },
  { id: "wishlists", label: "Wishlists", href: "/wishlists" },
  { id: "trips", label: "Trips", href: "/trips" },
  { id: "messages", label: "Messages", href: "/messages" },
  { id: "profile", label: "Profile", href: "/profile" },
] as const;

describe("MobileTabNavigation", () => {
  it("renders all five tab links with their labels and destinations", () => {
    const markup = renderToStaticMarkup(
      <MobileTabNavigation activeTab="explore" />,
    );

    for (const tab of tabs) {
      expect(markup).toContain(`href="${tab.href}"`);
      expect(markup).toContain(`<span>${tab.label}</span>`);
    }
  });

  it("marks only the active tab as the current page", () => {
    for (const tab of tabs) {
      const markup = renderToStaticMarkup(
        <MobileTabNavigation activeTab={tab.id} />,
      );

      expect(markup.match(/aria-current="page"/g)).toHaveLength(1);
      const activeLink = markup.match(
        /<a\b(?=[^>]*aria-current="page")[^>]*>/,
      )?.[0];
      expect(activeLink).toContain(`href="${tab.href}"`);
    }
  });
});
