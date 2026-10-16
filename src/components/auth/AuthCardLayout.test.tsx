import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AuthCardLayout } from "./AuthCardLayout";

describe("AuthCardLayout landmarks", () => {
  it("provides one main landmark with the shared skip-link target", () => {
    const markup = renderToStaticMarkup(
      <AuthCardLayout heading="Sign in">
        <form aria-label="Sign in form" />
      </AuthCardLayout>,
    );

    expect(markup.match(/<main\b/g)).toHaveLength(1);
    expect(markup).toContain('id="main-content"');
    expect(markup).toContain('aria-label="Sign in form"');
  });

  it("renders auth tabs without the standalone page layout in modal presentation", () => {
    const markup = renderToStaticMarkup(
      <AuthCardLayout
        heading="Sign in"
        presentation="modal"
        activeMode="login"
        footer="Don't have an account? Register"
      >
        <form aria-label="Sign in form" />
      </AuthCardLayout>,
    );

    expect(markup).toContain("Welcome to HostelLo");
    expect(markup).toContain('href="/login"');
    expect(markup).toContain('href="/register"');
    expect(markup).toContain('aria-current="page"');
    expect(markup).not.toContain("HOSTELLO</span>");
    expect(markup).not.toContain("Don't have an account?");
  });
});
