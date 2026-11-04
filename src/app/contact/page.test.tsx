import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn() }));

vi.mock("@/components/auth/BrowseAccountMenu", () => ({
  BrowseAccountMenu: () => <div data-testid="account-menu" />,
}));
vi.mock("@/lib/auth/config", () => ({ auth: mocks.auth }));

import ContactPage from "./page";

describe("ContactPage", () => {
  beforeEach(() => {
    mocks.auth.mockReset();
  });

  it("renders the contact form for anonymous visitors without prefill", async () => {
    mocks.auth.mockResolvedValue(null);

    const markup = renderToStaticMarkup(await ContactPage());

    expect(markup).toContain("Contact us");
    for (const field of ["name", "email", "subject", "message"]) {
      expect(markup).toContain(`name="${field}"`);
    }
    expect(markup).toContain("Send message");
    expect(markup).not.toContain("student@example.com");
  });

  it("prefills name and email for signed-in users", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "u1", name: "Alex Student", email: "student@example.com" },
    });

    const markup = renderToStaticMarkup(await ContactPage());

    expect(markup).toContain('value="Alex Student"');
    expect(markup).toContain('value="student@example.com"');
  });
});
