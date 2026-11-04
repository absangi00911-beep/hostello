// Path: scripts/safepay-sandbox-validation.test.mjs
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  sandboxProblems,
  maskTracker,
  isLocalBaseUrl,
  signPayload,
  buildReplayEvent,
  checkInvariants,
  renderReport,
} from "./safepay-sandbox-validation.mjs";

const goodEnv = {
  NEXT_PUBLIC_SAFEPAY_ENV: "sandbox",
  SAFEPAY_SECRET: "x",
  SAFEPAY_API_KEY: "sec_test_key",
  SAFEPAY_WEBHOOK_SECRET: "x",
  DATABASE_URL: "x",
};

describe("sandbox guard", () => {
  it("accepts an explicit sandbox configuration", () => {
    assert.deepEqual(sandboxProblems(goodEnv), []);
  });

  it("refuses production, unset, or any other value (stricter than the app, which treats unset as sandbox)", () => {
    for (const value of ["production", undefined, "", "Sandbox", "staging"]) {
      const problems = sandboxProblems({ ...goodEnv, NEXT_PUBLIC_SAFEPAY_ENV: value });
      assert.ok(problems.some((p) => p.includes("NEXT_PUBLIC_SAFEPAY_ENV")), `should refuse ${String(value)}`);
    }
  });

  it("refuses NODE_ENV=production and missing or malformed config, naming variables but never values", () => {
    const problems = sandboxProblems({ ...goodEnv, NODE_ENV: "production", SAFEPAY_SECRET: "", SAFEPAY_API_KEY: "pk_live_SECRETVALUE" });
    assert.ok(problems.some((p) => p.includes("NODE_ENV")));
    assert.ok(problems.some((p) => p.includes("SAFEPAY_SECRET is not set")));
    assert.ok(problems.some((p) => p.includes("SAFEPAY_API_KEY")));
    assert.ok(!problems.join(" ").includes("SECRETVALUE"));
  });
});

describe("helpers", () => {
  it("masks trackers to their last six characters", () => {
    assert.equal(maskTracker("track_abcdef123456"), "...123456");
    assert.equal(maskTracker(null), null);
    assert.equal(maskTracker(""), null);
  });

  it("only treats loopback hosts as local", () => {
    assert.equal(isLocalBaseUrl("http://localhost:3000"), true);
    assert.equal(isLocalBaseUrl("http://127.0.0.1:3000"), true);
    assert.equal(isLocalBaseUrl("https://hostello.pk"), false);
    assert.equal(isLocalBaseUrl("https://localhost.evil.example"), false);
    assert.equal(isLocalBaseUrl("not a url"), false);
  });

  it("signs with HMAC-SHA512 hex (128 chars), matching the webhook verifier's algorithm", () => {
    const body = '{"a":1}';
    const sig = signPayload("secret", body);
    assert.equal(sig.length, 128);
    assert.equal(sig, createHmac("sha512", "secret").update(body).digest("hex"));
    assert.notEqual(sig, signPayload("other", body));
  });

  it("builds a webhook event in minor units that matches what the route validates", () => {
    const event = buildReplayEvent({ bookingId: "b1", tracker: "t1", totalPkr: 45000, apiKey: "sec_k" });
    assert.equal(event.type, "payment.succeeded");
    assert.equal(event.merchant_api_key, "sec_k");
    assert.deepEqual(event.data, {
      tracker: "t1",
      state: "TRACKER_ENDED",
      amount: 4_500_000,
      currency: "PKR",
      metadata: { order_id: "b1" },
    });
  });
});

const booking = (over = {}) => ({
  id: "b1", total: 45000, cancellationRefundAmount: 20000, refundedAmount: 0, refundState: "NONE", ...over,
});
const ev = (type, attemptId, amount) => ({ type, attemptId, amount });
const failing = (checks) => checks.filter((c) => !c.ok).map((c) => c.name);

describe("money invariants", () => {
  it("passes for a clean partial refund", () => {
    const events = [ev("AUTOMATIC_REQUESTED", "a1", 20000), ev("AUTOMATIC_CONFIRMED", "a1", 20000)];
    assert.deepEqual(failing(checkInvariants(booking({ refundedAmount: 20000, refundState: "PARTIALLY_REFUNDED" }), events)), []);
  });

  it("flags a double refund (the B-001 symptom): 40000 refunded against 20000 approved", () => {
    const events = [
      ev("AUTOMATIC_REQUESTED", "a1", 20000), ev("AUTOMATIC_CONFIRMED", "a1", 20000),
      ev("AUTOMATIC_REQUESTED", "a2", 20000), ev("AUTOMATIC_CONFIRMED", "a2", 20000),
    ];
    const bad = failing(checkInvariants(booking({ refundedAmount: 40000, refundState: "PARTIALLY_REFUNDED" }), events));
    assert.ok(bad.some((n) => n.includes("approved refund")));
  });

  it("flags a refundedAmount that the audit events do not explain", () => {
    const bad = failing(checkInvariants(booking({ refundedAmount: 20000, refundState: "PARTIALLY_REFUNDED" }), []));
    assert.ok(bad.some((n) => n.includes("sum of confirmed")));
  });

  it("accepts an UNCERTAIN attempt with refundedAmount 0, and counts manual confirmation", () => {
    const uncertain = [ev("AUTOMATIC_REQUESTED", "a1", 20000), ev("AUTOMATIC_UNCERTAIN", "a1", 20000)];
    assert.deepEqual(failing(checkInvariants(booking({ refundState: "UNCERTAIN" }), uncertain)), []);
    const manual = [...uncertain, ev("MANUAL_CONFIRMED", "a1", 20000)];
    assert.deepEqual(failing(checkInvariants(booking({ refundedAmount: 20000, refundState: "PARTIALLY_REFUNDED" }), manual)), []);
  });

  it("allows one in-flight request only while PROCESSING", () => {
    const inflight = [ev("AUTOMATIC_REQUESTED", "a1", 20000)];
    assert.deepEqual(failing(checkInvariants(booking({ refundState: "PROCESSING" }), inflight)), []);
    assert.ok(failing(checkInvariants(booking({ refundState: "NONE" }), inflight)).length > 0);
  });
});

describe("report output", () => {
  it("masks trackers and never prints secrets or personal fields", () => {
    const text = renderReport(
      { ...booking({ refundedAmount: 20000, refundState: "PARTIALLY_REFUNDED" }), status: "CANCELLED", paymentStatus: "PARTIALLY_REFUNDED", paymentMethod: "safepay", transactionId: "track_secretvalue123456", refundedAt: null, updatedAt: new Date(0) },
      [{ eventType: "payment.succeeded", providerState: "TRACKER_ENDED", amountMinorUnits: 4_500_000, currency: "PKR", status: "PROCESSED", processingAttempts: 1, receivedAt: new Date(0), processedAt: new Date(0), lastErrorCode: null, tracker: "track_secretvalue123456" }],
      [{ attemptId: "attempt12345678", type: "AUTOMATIC_REQUESTED", amount: 20000, currency: "PKR", providerState: null, providerResponseDigest: null, failureName: null, failureCode: null, failureStatus: null, createdAt: new Date(0) }],
    );
    assert.ok(text.includes("...123456"));
    assert.ok(!text.includes("secretvalue"));
    assert.ok(text.includes("Consistency checks"));
  });
});

describe("CLI refusals (no database or network is touched)", () => {
  const script = fileURLToPath(new URL("./safepay-sandbox-validation.mjs", import.meta.url));
  const run = (args, env) =>
    spawnSync(process.execPath, [script, ...args], { env: { PATH: process.env.PATH, ...env }, encoding: "utf8" });

  it("refuses to run when the app is not explicitly in sandbox mode", () => {
    const result = run(["preflight"], { ...goodEnv, NEXT_PUBLIC_SAFEPAY_ENV: "production" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Preflight FAILED/);
  });

  it("preflight succeeds in sandbox and never echoes secret values", () => {
    const result = run(["preflight"], { ...goodEnv, SAFEPAY_SECRET: "TOPSECRETVALUE", SAFEPAY_WEBHOOK_SECRET: "WHSECRETVALUE" });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /sandbox\.api\.getsafepay\.com/);
    assert.ok(!result.stdout.includes("TOPSECRETVALUE") && !result.stdout.includes("WHSECRETVALUE"));
  });

  it("refuses a non-local replay target before touching the database", () => {
    const result = run(["replay-webhook", "b1", "--confirm-non-production-db", "--base-url", "https://hostello.pk"], goodEnv);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /localhost/);
  });

  it("refuses database commands without the explicit non-production confirmation", () => {
    const result = run(["report", "b1"], goodEnv);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /confirm-non-production-db/);
  });
});
