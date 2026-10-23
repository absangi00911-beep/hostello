import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const script = join(dirname(fileURLToPath(import.meta.url)), "neon-snapshot.mjs");

function startMock(handler) {
  const requests = [];
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const parsed = body ? JSON.parse(body) : null;
      requests.push({ method: req.method, url: req.url, auth: req.headers.authorization, body: parsed });
      handler(requests.length, parsed, res);
    });
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => resolve({ server, requests, base: `http://127.0.0.1:${server.address().port}` })),
  );
}

function run(env) {
  return new Promise((resolve) => {
    execFile(process.execPath, [script], { env: { PATH: process.env.PATH, ...env }, timeout: 20_000 }, (error, stdout, stderr) =>
      resolve({ code: error ? error.code : 0, stdout, stderr }),
    );
  });
}

const good = (n, body, res) => {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ branch: { id: "br-snap-1", name: body.branch.name } }));
};
const cfg = (base, extra = {}) => ({
  NEON_API_KEY: "key-123",
  NEON_PROJECT_ID: "proj-1",
  NEON_PRODUCTION_BRANCH_ID: "br-prod",
  NEON_API_BASE: base,
  GITHUB_SHA: "abcdef1234567890",
  GITHUB_RUN_ID: "42",
  GITHUB_RUN_ATTEMPT: "1",
  ...extra,
});

test("creates an expiring branch from the production branch", async () => {
  const m = await startMock(good);
  const r = await run(cfg(m.base));
  m.server.close();
  assert.equal(r.code, 0);
  assert.match(r.stdout, /Pre-migration snapshot created: pre-migrate-abcdef1-42-1 \(br-snap-1\)/);
  assert.equal(m.requests.length, 1);
  assert.equal(m.requests[0].url, "/projects/proj-1/branches");
  assert.equal(m.requests[0].auth, "Bearer key-123");
  assert.equal(m.requests[0].body.branch.parent_id, "br-prod");
  assert.ok(m.requests[0].body.branch.expires_at);
});

test("retries without expiry when the API rejects expires_at", async () => {
  const m = await startMock((n, body, res) => {
    if (n === 1) { res.statusCode = 400; res.end(JSON.stringify({ message: "unknown field expires_at" })); return; }
    good(n, body, res);
  });
  const r = await run(cfg(m.base));
  m.server.close();
  assert.equal(r.code, 0);
  assert.equal(m.requests.length, 2);
  assert.equal(m.requests[1].body.branch.expires_at, undefined);
  assert.match(r.stdout, /without auto-delete/);
});

test("warns and continues when settings are missing and the step is not required", async () => {
  const r = await run({});
  assert.equal(r.code, 0);
  assert.match(r.stdout, /::warning::.*NEON_API_KEY, NEON_PROJECT_ID, NEON_PRODUCTION_BRANCH_ID/);
});

test("fails when settings are missing and the step is required", async () => {
  const r = await run({ NEON_SNAPSHOT_REQUIRED: "true" });
  assert.notEqual(r.code, 0);
  assert.match(r.stderr, /::error::/);
});

test("warns on API failure when not required, fails when required", async () => {
  const m = await startMock((n, body, res) => { res.statusCode = 500; res.end("boom"); });
  const soft = await run(cfg(m.base));
  const hard = await run(cfg(m.base, { NEON_SNAPSHOT_REQUIRED: "true" }));
  m.server.close();
  assert.equal(soft.code, 0);
  assert.match(soft.stdout, /HTTP 500/);
  assert.notEqual(hard.code, 0);
});

test("never prints the API key", async () => {
  const m = await startMock((n, body, res) => { res.statusCode = 401; res.end(JSON.stringify({ message: "bad key-123" })); });
  const r = await run(cfg(m.base, { NEON_SNAPSHOT_REQUIRED: "true" }));
  m.server.close();
  assert.ok(!r.stdout.includes("Bearer"));
  assert.ok(!r.stderr.includes("Bearer"));
});
