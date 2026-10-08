import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  }),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));

import StyleGuidePage from "@/app/dev/style-guide/page";

describe("/dev/style-guide", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("returns 404 in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(() => StyleGuidePage()).toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });

  it("renders in development for token review", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(StyleGuidePage()).toBeTruthy();
    expect(mocks.notFound).not.toHaveBeenCalled();
  });
});
