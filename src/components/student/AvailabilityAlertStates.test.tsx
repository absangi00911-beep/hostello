import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AvailabilityAlertsLoading } from "./AvailabilityAlertStates";

describe("AvailabilityAlertsLoading", () => {
  it("announces loading while hiding skeletons from assistive technology", () => {
    const markup = renderToStaticMarkup(<AvailabilityAlertsLoading />);

    expect(markup).toContain('role="status"');
    expect(markup).toContain("Loading availability alerts…");
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('aria-busy="true"');
  });
});
