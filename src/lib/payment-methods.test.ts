import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_PAYMENT_METHOD, PAYMENT_METHODS } from "./payment-methods";

test("the default payment method matches the only currently supported checkout flow", () => {
  assert.equal(DEFAULT_PAYMENT_METHOD, "safepay");
});

test("only enabled payment methods are displayed to users", () => {
  const unavailable = PAYMENT_METHODS.filter((method) => !method.enabled);
  const available = PAYMENT_METHODS.filter((method) => method.enabled);

  // No disabled methods in the array (all are production-ready)
  assert.deepEqual(unavailable.map((method) => method.value), []);

  // Only Safepay is currently available
  assert.deepEqual(available.map((method) => method.value), ["safepay"]);
});
