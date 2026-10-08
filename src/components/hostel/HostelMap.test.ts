import { describe, expect, it } from "vitest";
import { buildHostelPopupHtml } from "./HostelMap";

describe("HostelMap popup HTML", () => {
  it("escapes the hostel name and address before passing them to Leaflet", () => {
    const html = buildHostelPopupHtml('<img src=x onerror="alert(1)">', '" onmouseover="alert(1)');

    expect(html).toContain("&lt;img");
    expect(html).toContain("&quot; onmouseover=&quot;");
    expect(html).not.toContain("<img");
  });
});
