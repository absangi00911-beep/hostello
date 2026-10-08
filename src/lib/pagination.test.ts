import { describe, expect, it } from "vitest";
import { parsePagination } from "@/lib/pagination";

describe("parsePagination", () => {
  it("applies route defaults and maximum result limits", () => {
    expect(parsePagination(new URLSearchParams(), { defaultLimit: 20, maxLimit: 50 }))
      .toEqual({ page: 1, limit: 20, skip: 0 });
    expect(parsePagination(new URLSearchParams("page=3&limit=500"), { defaultLimit: 20, maxLimit: 50 }))
      .toEqual({ page: 3, limit: 50, skip: 100 });
  });

  it("clamps negative page and limit inputs", () => {
    expect(parsePagination(new URLSearchParams("page=-2&limit=-100"), { defaultLimit: 20, maxLimit: 50 }))
      .toEqual({ page: 1, limit: 1, skip: 0 });
  });

  it("caps deep offsets and defaults malformed or overflowing input", () => {
    expect(parsePagination(new URLSearchParams("page=999999999999999999999999999999999999"), {
      defaultLimit: 20,
      maxLimit: 50,
    })).toEqual({ page: 10_000, limit: 20, skip: 199_980 });
    expect(parsePagination(new URLSearchParams("page=10001&limit=NaN"), { defaultLimit: 20, maxLimit: 50 }))
      .toEqual({ page: 10_000, limit: 20, skip: 199_980 });
  });
});
