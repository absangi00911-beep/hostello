import { describe, expect, it } from "vitest";
import { quoteFilterValue } from "@/lib/typesense";

describe("quoteFilterValue", () => {
  it("wraps plain values in backticks", () => {
    expect(quoteFilterValue("Lahore")).toBe("`Lahore`");
  });

  it("keeps filter operators inside the quoted value", () => {
    expect(quoteFilterValue("x || status:DRAFT")).toBe("`x || status:DRAFT`");
  });

  it("strips backticks so a value cannot close its own quotes", () => {
    expect(quoteFilterValue("a` || status:DRAFT || city:`b")).toBe(
      "`a || status:DRAFT || city:b`",
    );
  });
});
