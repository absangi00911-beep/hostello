import { describe, expect, it } from "vitest";
import { isCommonPassword } from "./common-passwords";

describe("isCommonPassword", () => {
  it("rejects the usual capital-plus-digit patterns", () => {
    for (const password of ["Password1", "Welcome123", "Qwerty123", "Iloveyou1", "Admin123", "Letmein1!"]) {
      expect(isCommonPassword(password), password).toBe(true);
    }
  });

  it("sees through trailing digits, symbols and look-alike characters", () => {
    for (const password of ["P@ssw0rd", "P@ssw0rd!", "Welcome2026", "W3lcome#1", "Passw0rd99", "L3tm31n!"]) {
      expect(isCommonPassword(password), password).toBe(true);
    }
  });

  it("rejects local words and names that are guessed first", () => {
    for (const password of ["Lahore2024", "Karachi123", "Pakistan1", "Bismillah1", "Hostello99", "Hostel123", "Student1"]) {
      expect(isCommonPassword(password), password).toBe(true);
    }
  });

  it("rejects passwords made of one or two repeated characters", () => {
    expect(isCommonPassword("Aaaaaaa1")).toBe(true);
    expect(isCommonPassword("ababababAB")).toBe(true);
  });

  it("accepts ordinary strong passwords and does not flag a common word inside a longer one", () => {
    for (const password of ["Blue-River-42", "Tr0ub4dour&3x", "Mango7Lantern", "Pass1word-ok", "Hostel-Blue-River-42"]) {
      expect(isCommonPassword(password), password).toBe(false);
    }
  });

  it("ignores case and surrounding whitespace, and an empty string is not 'common'", () => {
    expect(isCommonPassword("  PASSWORD1 ")).toBe(true);
    expect(isCommonPassword("")).toBe(false);
  });
});
