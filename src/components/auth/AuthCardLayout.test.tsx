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
});
