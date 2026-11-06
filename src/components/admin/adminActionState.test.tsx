import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminUncertainActionNotice } from "./AdminUncertainActionNotice";
import { isUncertainAdminActionStatus } from "./adminActionState";

describe("admin action outcome state", () => {
  it("treats server failures as uncertain but known client conflicts as resolved", () => {
    expect(isUncertainAdminActionStatus(500)).toBe(true);
    expect(isUncertainAdminActionStatus(503)).toBe(true);
    expect(isUncertainAdminActionStatus(400)).toBe(false);
    expect(isUncertainAdminActionStatus(403)).toBe(false);
    expect(isUncertainAdminActionStatus(409)).toBe(false);
  });

  it("asks the admin to refresh before repeating an action", () => {
    const markup = renderToStaticMarkup(
      <AdminUncertainActionNotice />,
    );
    expect(markup).toContain("The outcome of this action isn’t confirmed.");
    expect(markup).toContain("Refresh status");
    expect(markup).toContain('role="alert"');
  });
});
