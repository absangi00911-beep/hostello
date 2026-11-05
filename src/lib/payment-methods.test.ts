import { describe, expect, it } from "vitest";
import { ENABLED_PAYMENT_METHODS } from "@hostello/shared";
import { DEFAULT_PAYMENT_METHOD, PAYMENT_METHODS } from "./payment-methods";

describe("payment method availability", () => {
  it("uses the shared enabled-method list for UI choices and the booking default", () => {
    expect(PAYMENT_METHODS.filter((method) => method.enabled).map((method) => method.value))
      .toEqual(ENABLED_PAYMENT_METHODS);
    expect(DEFAULT_PAYMENT_METHOD).toBe("safepay");
  });
});
