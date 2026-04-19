import assert from "node:assert/strict";
import test from "node:test";

import { rateLimit } from "./rate-limit";

test("rateLimit exposes an async API and keeps local fallback semantics", async () => {
  const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
  const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;

  const pending = rateLimit("test:signup", { limit: 2, windowMs: 1_000 });
  assert.equal(typeof (pending as Promise<unknown>).then, "function");

  const first = await pending;
  const second = await rateLimit("test:signup", { limit: 2, windowMs: 1_000 });
  const third = await rateLimit("test:signup", { limit: 2, windowMs: 1_000 });

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(third.ok, false);

  if (previousUrl === undefined) {
    delete process.env.UPSTASH_REDIS_REST_URL;
  } else {
    process.env.UPSTASH_REDIS_REST_URL = previousUrl;
  }

  if (previousToken === undefined) {
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  } else {
    process.env.UPSTASH_REDIS_REST_TOKEN = previousToken;
  }
});
