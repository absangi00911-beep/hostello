import { describe, expect, it } from "vitest";
import {
  parsePosts,
  validatePostInput,
  validateReportReason,
} from "./RoommatesPage";

const post = {
  id: "p1",
  bio: "Quiet CS student",
  budget: 12000,
  moveIn: "2026-12-01T00:00:00.000Z",
  expiresAt: "2026-12-02T00:00:00.000Z",
  userId: "u1",
  user: { id: "u1", name: "Ayesha", avatar: null, city: "Lahore" },
};

describe("parsePosts", () => {
  it("parses a valid API payload", () => {
    const parsed = parsePosts({ data: [post] });

    expect(parsed).toHaveLength(1);
    expect(parsed?.[0].user.city).toBe("Lahore");
    expect(parsed?.[0].budget).toBe(12000);
  });

  it("tolerates missing optional fields", () => {
    const parsed = parsePosts({
      data: [{ ...post, budget: null, moveIn: null, user: { name: "Sara" } }],
    });

    expect(parsed?.[0].budget).toBeNull();
    expect(parsed?.[0].user.city).toBeNull();
  });

  it("rejects malformed payloads", () => {
    expect(parsePosts(null)).toBeNull();
    expect(parsePosts({ data: "x" })).toBeNull();
    expect(parsePosts({ data: [{ ...post, user: null }] })).toBeNull();
  });
});

describe("validatePostInput", () => {
  it("requires a bio of at most 200 characters", () => {
    expect(validatePostInput({ bio: "  ", budget: "" })).toMatch(/little about/);
    expect(validatePostInput({ bio: "x".repeat(201), budget: "" })).toMatch(/200/);
    expect(validatePostInput({ bio: "Hello there", budget: "" })).toBeNull();
  });

  it("accepts an empty budget but rejects invalid ones", () => {
    expect(validatePostInput({ bio: "Hi", budget: "15000" })).toBeNull();
    expect(validatePostInput({ bio: "Hi", budget: "-5" })).toMatch(/Budget/);
    expect(validatePostInput({ bio: "Hi", budget: "12.5" })).toMatch(/Budget/);
    expect(validatePostInput({ bio: "Hi", budget: "abc" })).toMatch(/Budget/);
  });
});

describe("validateReportReason", () => {
  it("requires 3 to 500 characters", () => {
    expect(validateReportReason("ab")).toMatch(/3 to 500/);
    expect(validateReportReason("x".repeat(501))).toMatch(/3 to 500/);
    expect(validateReportReason("Spam")).toBeNull();
  });
});
