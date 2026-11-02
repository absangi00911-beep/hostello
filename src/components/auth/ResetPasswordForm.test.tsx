import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ResetPasswordForm } from "./ResetPasswordForm";

describe("ResetPasswordForm", () => {
  it("asks for a new link when the token is missing", () => {
    const markup = renderToStaticMarkup(<ResetPasswordForm token={null} />);

    expect(markup).toContain("invalid or has expired");
    expect(markup).toContain('href="/forgot-password"');
  });

  it("rejects a malformed token", () => {
    const markup = renderToStaticMarkup(<ResetPasswordForm token="abc" />);

    expect(markup).toContain("invalid or has expired");
  });

  it("shows the password form for a well-formed token", () => {
    const markup = renderToStaticMarkup(
      <ResetPasswordForm token={"a".repeat(64)} />,
    );

    expect(markup).toContain("New password");
    expect(markup).toContain("Change password");
  });
});
