import { afterEach, describe, expect, it, vi } from "vitest";
import { getScrollBehavior } from "@/lib/scroll-behavior";

afterEach(() => vi.unstubAllGlobals());

const withReducedMotion = (reduce: boolean) =>
  vi.stubGlobal("window", {
    matchMedia: (query: string) => ({ matches: reduce && query === "(prefers-reduced-motion: reduce)" }),
  });

describe("getScrollBehavior", () => {
  it("scrolls smoothly by default", () => {
    withReducedMotion(false);
    expect(getScrollBehavior()).toBe("smooth");
  });

  it("jumps instantly for visitors who asked to reduce motion", () => {
    withReducedMotion(true);
    expect(getScrollBehavior()).toBe("instant");
  });

  it("does not throw without a window or matchMedia (server rendering, old browsers)", () => {
    expect(getScrollBehavior()).toBe("auto");
    vi.stubGlobal("window", {});
    expect(getScrollBehavior()).toBe("auto");
  });
});
