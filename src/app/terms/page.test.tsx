import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/auth/BrowseAccountMenu", () => ({
  BrowseAccountMenu: () => <div data-testid="account-menu" />,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/auth/header-user", () => ({
  getHeaderUser: async () => null,
}));

import PrivacyPage from "../privacy/page";
import TermsPage from "./page";

describe("legal placeholder pages", () => {
  it("marks terms as an unpublished placeholder", async () => {
    const markup = renderToStaticMarkup(await TermsPage());

    expect(markup).toContain("Terms of Service");
    expect(markup).toContain("placeholder");
    expect(markup).toContain("<header");
  });

  it("marks privacy as an unpublished placeholder", async () => {
    const markup = renderToStaticMarkup(await PrivacyPage());

    expect(markup).toContain("Privacy Policy");
    expect(markup).toContain("placeholder");
    expect(markup).toContain("<header");
  });
});
