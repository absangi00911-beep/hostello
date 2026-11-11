import assert from "node:assert/strict";
import { test } from "node:test";
import { resolvePlaywrightTarget } from "../e2e/playwright-target-guard.mjs";

const sandbox = {
  PLAYWRIGHT_BASE_URL: "https://preview.example.test",
  PLAYWRIGHT_ALLOW_REMOTE_SANDBOX: "1",
  PLAYWRIGHT_SANDBOX_HOST: "preview.example.test",
};

test("Playwright defaults to loopback and allows explicit loopback targets", () => {
  assert.deepEqual(resolvePlaywrightTarget({}), {
    baseURL: "http://127.0.0.1:3100",
    isLocal: true,
  });
  assert.equal(resolvePlaywrightTarget({ PLAYWRIGHT_BASE_URL: "http://localhost:3000" }).isLocal, true);
});

test("remote target is refused unless explicit sandbox opt-in and exact host are supplied", () => {
  assert.throws(() => resolvePlaywrightTarget({ PLAYWRIGHT_BASE_URL: sandbox.PLAYWRIGHT_BASE_URL }), /Refusing non-loopback/);
  assert.throws(() => resolvePlaywrightTarget({ ...sandbox, PLAYWRIGHT_SANDBOX_HOST: "other.example.test" }), /exactly match/);
  assert.throws(() => resolvePlaywrightTarget({ ...sandbox, PLAYWRIGHT_BASE_URL: "http://preview.example.test" }), /HTTPS/);
  assert.deepEqual(resolvePlaywrightTarget(sandbox), {
    baseURL: "https://preview.example.test",
    isLocal: false,
  });
});

test("credentials, query strings, and fragments are refused", () => {
  assert.throws(() => resolvePlaywrightTarget({ PLAYWRIGHT_BASE_URL: "http://user:pass@localhost:3000" }), /credentials/);
  assert.throws(() => resolvePlaywrightTarget({ PLAYWRIGHT_BASE_URL: "http://localhost:3000/?token=x" }), /query string/);
  assert.throws(() => resolvePlaywrightTarget({ PLAYWRIGHT_BASE_URL: "http://localhost:3000/#secret" }), /query string/);
});
