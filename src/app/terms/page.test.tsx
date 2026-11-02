import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PrivacyPage from "../privacy/page";
import TermsPage from "./page";

describe("legal placeholder pages", () => {
  it("marks terms as an unpublished placeholder", () => {
    const markup = renderToStaticMarkup(<TermsPage />);

    expect(markup).toContain("Terms of Service");
    expect(markup).toContain("placeholder");
  });

  it("marks privacy as an unpublished placeholder", () => {
    const markup = renderToStaticMarkup(<PrivacyPage />);

    expect(markup).toContain("Privacy Policy");
    expect(markup).toContain("placeholder");
  });
});
