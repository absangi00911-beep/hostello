import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button contrast classes", () => {
  it.each(["default", "destructive"] as const)("preserves inverse text color for the %s variant", (variant) => {
    const markup = renderToStaticMarkup(<Button variant={variant}>Continue</Button>);

    expect(markup).toContain("text-[color:var(--color-text-inverse)]");
    expect(markup).toContain("text-[length:var(--text-body-sm)]");
  });
});
