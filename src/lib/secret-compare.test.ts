import { describe, expect, it } from "vitest";
import { safeSecretEqual } from "./secret-compare";

describe("safeSecretEqual", () => {
  it("accepts an identical secret", () => {
    expect(safeSecretEqual("sec_live_abc123", "sec_live_abc123")).toBe(true);
  });

  it("rejects a same-length secret that differs", () => {
    expect(safeSecretEqual("sec_live_abc124", "sec_live_abc123")).toBe(false);
  });

  it("rejects a shorter secret without throwing", () => {
    expect(() => safeSecretEqual("sec_live", "sec_live_abc123")).not.toThrow();
    expect(safeSecretEqual("sec_live", "sec_live_abc123")).toBe(false);
  });

  it("rejects a longer secret without throwing", () => {
    expect(() => safeSecretEqual("sec_live_abc123_extra", "sec_live_abc123")).not.toThrow();
    expect(safeSecretEqual("sec_live_abc123_extra", "sec_live_abc123")).toBe(false);
  });

  it("rejects a provided value that only extends the expected one as a prefix", () => {
    expect(safeSecretEqual("abc", "abcd")).toBe(false);
    expect(safeSecretEqual("abcd", "abc")).toBe(false);
  });

  it("rejects an empty provided secret", () => {
    expect(safeSecretEqual("", "sec_live_abc123")).toBe(false);
  });

  it("rejects everything when the expected secret is unset or empty", () => {
    expect(safeSecretEqual("", "")).toBe(false);
    expect(safeSecretEqual("anything", "")).toBe(false);
    expect(safeSecretEqual("anything", undefined)).toBe(false);
    expect(safeSecretEqual("anything", null)).toBe(false);
  });

  it("rejects a provided value that is not a string", () => {
    expect(safeSecretEqual(undefined, "sec")).toBe(false);
    expect(safeSecretEqual(null, "sec")).toBe(false);
    expect(safeSecretEqual(123, "123")).toBe(false);
    expect(safeSecretEqual(["sec"], "sec")).toBe(false);
    expect(safeSecretEqual({ toString: () => "sec" }, "sec")).toBe(false);
  });

  it("compares non-ASCII secrets by their bytes", () => {
    expect(safeSecretEqual("sécret-ключ", "sécret-ключ")).toBe(true);
    expect(safeSecretEqual("secret-ключ", "sécret-ключ")).toBe(false);
  });
});
