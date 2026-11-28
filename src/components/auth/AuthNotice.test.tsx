import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AuthNotice } from "./AuthNotice";

describe("AuthNotice", () => {
  it("announces errors assertively", () => {
    const markup = renderToStaticMarkup(
      <AuthNotice tone="error">Passwords do not match.</AuthNotice>,
    );

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("text-danger");
    expect(markup).not.toContain("tabindex");
  });

  it("announces confirmations politely", () => {
    const markup = renderToStaticMarkup(
      <AuthNotice tone="success">Saved.</AuthNotice>,
    );

    expect(markup).toContain('role="status"');
  });

  it("can take focus so a replaced form lands on its confirmation", () => {
    const markup = renderToStaticMarkup(
      <AuthNotice focusOnMount tone="success">
        Check your inbox.
      </AuthNotice>,
    );

    expect(markup).toContain('tabindex="-1"');
  });

  it("keeps the id other fields reference for aria-describedby", () => {
    const markup = renderToStaticMarkup(
      <AuthNotice id="login-dialog-error" tone="error">
        Wrong password.
      </AuthNotice>,
    );

    expect(markup).toContain('id="login-dialog-error"');
  });
});
