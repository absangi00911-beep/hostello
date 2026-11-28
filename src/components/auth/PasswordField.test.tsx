import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PasswordField } from "./PasswordField";

function render(props: Partial<Parameters<typeof PasswordField>[0]> = {}) {
  return renderToStaticMarkup(
    <PasswordField
      autoComplete="new-password"
      inputClassName="input"
      label="Password"
      name="password"
      onChange={() => {}}
      value=""
      {...props}
    />,
  );
}

describe("PasswordField", () => {
  it("starts hidden and labels the input with a real <label>", () => {
    const markup = render();
    const id = /<input[^>]*id="([^"]+)"/.exec(markup)?.[1];

    expect(markup).toContain('type="password"');
    expect(id).toBeTruthy();
    expect(markup).toContain(`for="${id}"`);
    expect(markup).toContain('autoComplete="new-password"');
    expect(markup).toContain('name="password"');
  });

  it("offers a named show control that is not a submit button", () => {
    const markup = render({ label: "New password" });

    expect(markup).toMatch(/<button[^>]*type="button"[^>]*>Show<\/button>/);
    expect(markup).toContain('aria-label="Show new password"');
  });

  it("links the hint and any external message to the input", () => {
    const markup = render({
      hint: "At least 8 characters.",
      describedBy: "login-dialog-error",
      invalid: true,
    });
    const describedBy = /aria-describedby="([^"]+)"/.exec(markup)?.[1] ?? "";

    expect(describedBy).toContain("login-dialog-error");
    const hintId = describedBy.split(" ")[0];
    expect(markup).toContain(`id="${hintId}"`);
    expect(markup).toContain("At least 8 characters.");
    expect(markup).toContain('aria-invalid="true"');
  });

  it("omits aria-describedby and aria-invalid when there is nothing to describe", () => {
    const markup = render();

    expect(markup).not.toContain("aria-describedby");
    expect(markup).not.toContain("aria-invalid");
  });
});
