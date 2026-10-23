#!/usr/bin/env node
/**
 * Create a Neon branch of the production database before migrations run.
 *
 * A Neon branch is a copy-on-write snapshot of the parent at the moment it is
 * created, so a migration that goes wrong can be inspected or recovered from.
 * The branch is given an expiry so snapshots clean themselves up.
 *
 * Environment
 *   NEON_API_KEY                 secret; API key with access to the project
 *   NEON_PROJECT_ID              project id (not secret)
 *   NEON_PRODUCTION_BRANCH_ID    id of the production branch to snapshot
 *   NEON_SNAPSHOT_REQUIRED       "true" makes any failure or missing setting fail the job
 *   NEON_SNAPSHOT_TTL_DAYS       days until the snapshot expires (default 14)
 *   NEON_API_BASE                override for tests (default https://console.neon.tech/api/v2)
 *   GITHUB_SHA, GITHUB_RUN_ID, GITHUB_RUN_ATTEMPT   used to name the branch
 *
 * While the settings are absent the step only warns, so it can ship before the
 * secrets exist. Set NEON_SNAPSHOT_REQUIRED=true to make it a hard gate.
 */
import { appendFileSync } from "node:fs";

const env = process.env;
const base = (env.NEON_API_BASE || "https://console.neon.tech/api/v2").replace(/\/+$/, "");
const required = env.NEON_SNAPSHOT_REQUIRED === "true";
const ttlDays = Number(env.NEON_SNAPSHOT_TTL_DAYS || 14);

function finish(level, message, code) {
  if (level === "error") console.error(`::error::${message}`);
  else if (level === "warning") console.log(`::warning::${message}`);
  else console.log(message);
  process.exit(code);
}

function fail(message) {
  if (required) finish("error", message, 1);
  finish("warning", `${message} Continuing without a snapshot because NEON_SNAPSHOT_REQUIRED is not "true".`, 0);
}

const missing = ["NEON_API_KEY", "NEON_PROJECT_ID", "NEON_PRODUCTION_BRANCH_ID"].filter((k) => !env[k]);
if (missing.length) {
  fail(`Pre-migration snapshot not configured: ${missing.join(", ")} not set.`);
}
if (!Number.isFinite(ttlDays) || ttlDays <= 0) {
  fail("NEON_SNAPSHOT_TTL_DAYS must be a positive number.");
}

const sha = (env.GITHUB_SHA || "local").slice(0, 7);
const run = `${env.GITHUB_RUN_ID || Date.now()}-${env.GITHUB_RUN_ATTEMPT || 1}`;
const name = `pre-migrate-${sha}-${run}`;
const expiresAt = new Date(Date.now() + ttlDays * 86_400_000).toISOString();

async function createBranch(withExpiry) {
  const branch = { name, parent_id: env.NEON_PRODUCTION_BRANCH_ID };
  if (withExpiry) branch.expires_at = expiresAt;
  const res = await fetch(`${base}/projects/${encodeURIComponent(env.NEON_PROJECT_ID)}/branches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.NEON_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ branch }),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-JSON error body */ }
  return { res, json, text };
}

let result;
try {
  result = await createBranch(true);
  // If this API version rejects expires_at, still take the snapshot.
  if ([400, 422].includes(result.res.status)) {
    console.log("::warning::Neon rejected the branch expiry; creating the snapshot without auto-delete.");
    result = await createBranch(false);
  }
} catch (error) {
  fail(`Neon snapshot request failed: ${error instanceof Error ? error.message : String(error)}.`);
}

if (!result.res.ok || !result.json?.branch?.id) {
  const detail = (result.json?.message || result.text || "").slice(0, 200);
  fail(`Neon snapshot failed with HTTP ${result.res.status}${detail ? `: ${detail}` : ""}.`);
}

const branchId = result.json.branch.id;
const line = `Pre-migration snapshot created: ${name} (${branchId}).`;
if (env.GITHUB_STEP_SUMMARY) {
  appendFileSync(env.GITHUB_STEP_SUMMARY, `### Pre-migration snapshot\n\n- Neon branch: \`${name}\` (\`${branchId}\`)\n- Expires: ${expiresAt}\n`);
}
finish("info", line, 0);
