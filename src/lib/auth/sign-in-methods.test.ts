import { describe, expect, it } from "vitest";
import { getConfiguredSignInMethods } from "./sign-in-methods";

describe("getConfiguredSignInMethods", () => {
  it("always enables email and password while hiding unconfigured providers", () => {
    expect(getConfiguredSignInMethods({})).toEqual({
      emailPassword: true,
      emailCode: false,
      google: false,
    });
  });

  it("enables email-code only when a real Resend key is configured", () => {
    expect(
      getConfiguredSignInMethods({ RESEND_API_KEY: "re_test_email_key" }),
    ).toEqual({
      emailPassword: true,
      emailCode: true,
      google: false,
    });
    expect(
      getConfiguredSignInMethods({ RESEND_API_KEY: "re_placeholder" })
        .emailCode,
    ).toBe(false);
  });

  it("enables Google only when both credentials are configured", () => {
    expect(
      getConfiguredSignInMethods({ AUTH_GOOGLE_ID: "google-client-id" }).google,
    ).toBe(false);
    expect(
      getConfiguredSignInMethods({
        AUTH_GOOGLE_ID: "google-client-id",
        AUTH_GOOGLE_SECRET: "google-client-secret",
      }).google,
    ).toBe(true);
  });
});
