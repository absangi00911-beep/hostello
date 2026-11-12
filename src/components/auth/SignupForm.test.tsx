import { describe, expect, it } from "vitest";
import { validateSignupPassword } from "./SignupForm";

describe("validateSignupPassword", () => {
  it("accepts a password that meets the server rules", () => {
    expect(validateSignupPassword("Mango7Lantern")).toBeNull();
  });

  it("rejects short passwords", () => {
    expect(validateSignupPassword("Ab1")).toMatch(/at least 8/);
  });

  it("requires an uppercase letter and a number", () => {
    expect(validateSignupPassword("hostel123")).toMatch(/uppercase/);
    expect(validateSignupPassword("Hostelabc")).toMatch(/number/);
  });

  it("rejects very common passwords", () => {
    expect(validateSignupPassword("Password1")).toMatch(/too common/);
    expect(validateSignupPassword("P@ssw0rd")).toMatch(/too common/);
  });
});
