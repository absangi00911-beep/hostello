import { describe, expect, it } from "vitest";
import { renderHostelShareImage } from "@/lib/hostel-share-image";

describe("renderHostelShareImage", () => {
  it("renders a cacheable PNG for a hostel", async () => {
    const response = renderHostelShareImage({
      name: "Green View Hostel",
      location: "Gulberg, Lahore",
      genderLabel: "Women\u2019s hostel",
      priceLabel: "From PKR 9,500/month",
      ratingLabel: "4.5/5 \u00b7 12 reviews",
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toContain("s-maxage=3600");
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(1000);
  });

  it("renders the branded fallback when the hostel is missing", async () => {
    const response = renderHostelShareImage(null);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
  });

  it("caches the missing-hostel fallback only briefly", () => {
    const response = renderHostelShareImage(null);
    expect(response.headers.get("cache-control")).toBe("public, max-age=0, s-maxage=300");
  });

  it("never caches the fallback served after a lookup failure", () => {
    const response = renderHostelShareImage(null, { lookupFailed: true });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
