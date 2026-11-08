import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sentry = vi.hoisted(() => ({ captureException: vi.fn() }));
vi.mock("@sentry/nextjs", () => sentry);
// Run effects synchronously: server rendering never executes useEffect.
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useEffect: (effect: () => void) => effect(),
}));

import GlobalError from "@/app/global-error";

function findByType(node: ReactNode, type: string): ReactElement | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findByType(child, type);
      if (found) return found;
    }
    return null;
  }
  const element = node as ReactElement<{ children?: ReactNode }>;
  if (element.type === type) return element;
  return findByType(element.props?.children, type);
}

describe("global-error", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reports the error to Sentry and renders only fixed copy in a full document", () => {
    const error = Object.assign(new Error("secret internal detail"), { digest: "abc123" });

    const html = renderToStaticMarkup(<GlobalError error={error} retry={() => {}} />);

    expect(sentry.captureException).toHaveBeenCalledWith(error);
    expect(html.startsWith('<html lang="en">')).toBe(true);
    expect(html).toContain("<body");
    expect(html).toContain('name="viewport"');
    expect(html).toContain('role="alert"');
    expect(html).toContain("Something went wrong");
    expect(html).toContain("Try again");
    expect(html).not.toContain("secret internal detail");
    expect(html).not.toContain("abc123");
  });

  it("wires the button to retry", () => {
    const retry = vi.fn();
    const tree = GlobalError({ error: new Error("boom"), retry });

    const button = findByType(tree, "button") as ReactElement<{ onClick: () => void }> | null;
    expect(button).not.toBeNull();
    button!.props.onClick();

    expect(retry).toHaveBeenCalledTimes(1);
  });
});
