import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { BrowseAccountMenu } from "./BrowseAccountMenu";

describe("BrowseAccountMenu", () => {
  it("shows a signed-in user's photo avatar when one is available", () => {
    const markup = renderToStaticMarkup(
      <BrowseAccountMenu
        user={{
          name: "Alex Student",
          email: "student@example.com",
          role: "STUDENT",
          avatar: "https://images.unsplash.com/student.jpg",
        }}
      />,
    );

    expect(markup).toContain('src="https://images.unsplash.com/student.jpg"');
    expect(markup).toContain('alt=""');
    expect(markup).not.toContain(">A</span>");
  });

  it("shows a signed-in user's name and avatar initial in the account trigger", () => {
    const markup = renderToStaticMarkup(
      <BrowseAccountMenu
        user={{
          name: "Alex Student",
          email: "student@example.com",
          role: "STUDENT",
        }}
      />,
    );

    expect(markup).toContain('aria-label="Account menu for Alex Student"');
    const avatarClass = markup
      .match(/<span aria-hidden="true" class="([^"]+)">/)?.[1]
      ?.split(" ");
    expect(avatarClass).toEqual(
      expect.arrayContaining(["h-8", "w-8", "rounded-full", "bg-brand"]),
    );
    expect(markup).not.toContain("browse-account-avatar");
    expect(markup).toContain(">A</span>");
    expect(markup).toContain("Alex Student");
  });

  it("uses the email's local part when the user has no display name", () => {
    const markup = renderToStaticMarkup(
      <BrowseAccountMenu
        user={{ name: null, email: "student@example.com", role: "STUDENT" }}
      />,
    );

    expect(markup).toContain('aria-label="Account menu for student"');
    expect(markup).toContain(">S</span>");
  });
});
