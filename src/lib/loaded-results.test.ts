import { describe, expect, it } from "vitest";
import { isLoadedResultsCurrent } from "@/lib/loaded-results";

describe("isLoadedResultsCurrent", () => {
  it("is true only when the results on screen answer this request at this retry count", () => {
    expect(isLoadedResultsCurrent({ key: "all", reload: 0 }, "all", 0)).toBe(true);
    expect(isLoadedResultsCurrent({ key: "all", reload: 0 }, "women", 0)).toBe(false);
    expect(isLoadedResultsCurrent({ key: "all", reload: 0 }, "all", 1)).toBe(false);
  });

  it("is false when nothing on screen can be trusted", () => {
    expect(isLoadedResultsCurrent(null, "all", 0)).toBe(false);
  });
});
