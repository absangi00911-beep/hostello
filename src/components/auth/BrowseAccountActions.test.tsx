import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./BrowseAccountMenu", () => ({
  BrowseAccountMenu: () => <button type="button">Account</button>,
}));

import { BrowseAccountActions } from "./BrowseAccountActions";

describe("BrowseAccountActions", () => {
  it("does not offer host sign-up to a student", () => {
    const markup = renderToStaticMarkup(
      <BrowseAccountActions user={{ role: "STUDENT" }} />,
    );

    expect(markup).not.toContain("Become a host");
  });

  it.each([
    ["a guest", null],
    ["an owner", { role: "OWNER" as const }],
    ["an admin", { role: "ADMIN" as const }],
  ])("keeps host sign-up visible to %s", (_description, user) => {
    const markup = renderToStaticMarkup(
      <BrowseAccountActions user={user} />,
    );

    expect(markup).toContain("Become a host");
    expect(markup).toContain('href="/signup?role=OWNER"');
  });
});
