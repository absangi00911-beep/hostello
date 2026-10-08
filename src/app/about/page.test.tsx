import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/layout/PublicLayout", () => ({
  PublicLayout: ({ children }: { children: ReactNode }) => (
    <div>
      <main id="main-content">{children}</main>
    </div>
  ),
}));

import AboutPage from "./page";

describe("AboutPage landmarks", () => {
  it("uses the shared public main landmark without nesting another one", () => {
    const markup = renderToStaticMarkup(<AboutPage />);

    expect(markup.match(/<main\b/g)).toHaveLength(1);
    expect(markup.match(/<h1\b/g)).toHaveLength(1);
  });
});
