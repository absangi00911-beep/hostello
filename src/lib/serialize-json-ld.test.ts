import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "./serialize-json-ld";

describe("serializeJsonLd", () => {
  it("escapes HTML script delimiters while preserving the JSON value", () => {
    const value = { name: "</script><script>alert(1)</script>" };

    const serialized = serializeJsonLd(value);

    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c/script>");
    expect(JSON.parse(serialized)).toEqual(value);
  });

  it("throws when the value cannot be serialized", () => {
    expect(() => serializeJsonLd(undefined)).toThrow("JSON-LD value must be serializable");
  });
});
