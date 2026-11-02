import { describe, expect, it } from "vitest";
import {
  parseCheckoutUrl,
  parseReturnState,
  parseSubscription,
  readSubscriptionError,
} from "./ownerSubscription";

describe("parseSubscription", () => {
  it("accepts the /api/owner/subscription shape", () => {
    const parsed = parseSubscription({
      plan: "PRO",
      subscription: {
        status: "ACTIVE",
        startDate: "2026-10-01T00:00:00.000Z",
        endDate: "2026-11-01T00:00:00.000Z",
      },
      listingCount: 3,
    });
    expect(parsed?.plan).toBe("PRO");
    expect(parsed?.subscription?.status).toBe("ACTIVE");
    expect(parsed?.listingCount).toBe(3);
  });

  it("allows a null subscription for free owners", () => {
    const parsed = parseSubscription({ plan: "FREE", subscription: null, listingCount: 0 });
    expect(parsed?.subscription).toBeNull();
  });

  it("rejects unknown plans and bad shapes", () => {
    expect(parseSubscription({ plan: "GOLD", subscription: null, listingCount: 0 })).toBeNull();
    expect(parseSubscription({ plan: "FREE", subscription: null })).toBeNull();
    expect(parseSubscription(null)).toBeNull();
  });
});

describe("parseCheckoutUrl", () => {
  it("accepts https links only", () => {
    expect(parseCheckoutUrl({ checkoutUrl: "https://pay.example.com/c?t=1" })).toBe(
      "https://pay.example.com/c?t=1",
    );
    expect(parseCheckoutUrl({ checkoutUrl: "http://pay.example.com" })).toBeNull();
    expect(parseCheckoutUrl({ checkoutUrl: "javascript:alert(1)" })).toBeNull();
    expect(parseCheckoutUrl({})).toBeNull();
  });
});

describe("parseReturnState", () => {
  it("maps the Safepay return flags", () => {
    expect(parseReturnState({ upgraded: "1" })).toBe("upgraded");
    expect(parseReturnState({ cancelled: ["1"] })).toBe("cancelled");
    expect(parseReturnState({ upgraded: "0" })).toBeNull();
    expect(parseReturnState({})).toBeNull();
  });
});

describe("readSubscriptionError", () => {
  it("uses the API message or the fallback", () => {
    expect(readSubscriptionError({ error: "Already on Pro plan" }, "x")).toBe("Already on Pro plan");
    expect(readSubscriptionError(null, "fallback")).toBe("fallback");
  });
});
