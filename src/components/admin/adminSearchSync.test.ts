import { describe, expect, it } from "vitest";
import {
  interpretSyncResponse,
  retryAfterLabel,
  validateHostelId,
} from "./adminSearchSync";

describe("validateHostelId", () => {
  it("requires an id without spaces within the API limit", () => {
    expect(validateHostelId("  ")).toBe("Enter a hostel ID.");
    expect(validateHostelId("a b")).toBe("A hostel ID has no spaces.");
    expect(validateHostelId("x".repeat(65))).toContain("at most 64");
    expect(validateHostelId(" cl123 ")).toBeNull();
  });
});

describe("retryAfterLabel", () => {
  it("words the wait and ignores bad headers", () => {
    expect(retryAfterLabel("30")).toBe("about a minute");
    expect(retryAfterLabel("1800")).toBe("about 30 minutes");
    expect(retryAfterLabel("7200")).toBe("about 2 hours");
    expect(retryAfterLabel("soon")).toBeNull();
    expect(retryAfterLabel(null)).toBeNull();
  });
});

describe("interpretSyncResponse", () => {
  it("shows the API message on success", () => {
    expect(interpretSyncResponse(200, { message: "All hostels synced to Typesense" }, null))
      .toEqual({ ok: true, message: "All hostels synced to Typesense" });
  });

  it("explains the rate limit with the wait time", () => {
    const result = interpretSyncResponse(429, { error: "Too many" }, "1800");
    expect(result.ok).toBe(false);
    expect(result.message).toContain("about 30 minutes");
  });

  it("falls back to the API error, then a generic one", () => {
    expect(interpretSyncResponse(403, { error: "Forbidden" }, null).message).toBe("Forbidden");
    expect(interpretSyncResponse(500, null, null).message).toBe("Something went wrong. Try again.");
  });

  it("marks server failures as uncertain so the action cannot be repeated blindly", () => {
    expect(interpretSyncResponse(500, null, null).uncertain).toBe(true);
    expect(interpretSyncResponse(403, { error: "Forbidden" }, null).uncertain).toBeFalsy();
  });
});
