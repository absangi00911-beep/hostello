import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_PAYMENT_METHOD, PAYMENT_METHODS } from "./payment-methods";

test("the default payment method matches the only currently supported checkout flow", () => {
  assert.equal(DEFAULT_PAYMENT_METHOD, "safepay");
});

test("unimplemented payment methods stay visible but disabled", () => {
  const unavailable = PAYMENT_METHODS.filter((method) => !method.enabled);
  const available = PAYMENT_METHODS.filter((method) => method.enabled);

  assert.deepEqual(
    unavailable.map((method) => method.value),
    ["jazzcash", "easypaisa"]
  );
  assert.deepEqual(
    available.map((method) => method.value),
    ["safepay"]
  );
});
