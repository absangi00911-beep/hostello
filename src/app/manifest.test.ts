import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("web manifest", () => {
  it("is installable: name, start URL and 192/512 icons", () => {
    const result = manifest();
    expect(result.short_name).toBe("HostelLo");
    expect(result.start_url).toBe("/");
    expect(result.icons?.map((icon) => icon.sizes)).toEqual(["192x192", "512x512"]);
  });
});
