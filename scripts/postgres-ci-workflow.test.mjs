import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// Drop YAML comment lines so a commented-out step cannot satisfy an assertion.
function readWorkflow(name) {
  return readFileSync(new URL(`../.github/workflows/${name}`, import.meta.url), "utf8")
    .split("\n")
    .filter((line) => !/^\s*#/.test(line))
    .join("\n");
}

const ciWorkflow = readWorkflow("ci.yml");
const productionWorkflow = readWorkflow("production.yml");

function jobSection(source, name) {
  const jobsStart = source.indexOf("jobs:");
  assert.notEqual(jobsStart, -1, "workflow must define jobs");
  const jobs = source.slice(jobsStart);
  const jobStart = jobs.search(new RegExp(`^  ${name}:`, "m"));
  assert.notEqual(jobStart, -1, `workflow must define the ${name} job`);
  const remaining = jobs.slice(jobStart + 1);
  const nextJob = remaining.search(/^  [a-z0-9-]+:/m);
  return nextJob === -1 ? remaining : remaining.slice(0, nextJob);
}

function databaseTarget(postgres, name) {
  const match = postgres.match(new RegExp(
    `^\\s*${name}:\\s*["']?((?:postgres|postgresql)://[^\\s"']+)`,
    "m",
  ));
  assert.ok(match, `${name} must be explicitly configured in the PostgreSQL job`);

  const target = new URL(match[1]);
  assert.ok(
    ["localhost", "127.0.0.1", "::1", "[::1]"].includes(target.hostname),
    `${name} must use a loopback host`,
  );
  const database = decodeURIComponent(target.pathname.slice(1));
  assert.match(database, /^[A-Za-z0-9_]*_test$/, `${name} must target a *_test database`);
  return {
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port,
    database,
  };
}

function assertPostgresJob(postgres) {
  assert.match(postgres, /services:\s*\n\s+postgres:/);
  assert.match(postgres, /--health-cmd\s+"pg_isready/);
  const migrationTarget = databaseTarget(postgres, "DATABASE_URL");
  const guardedTestTarget = databaseTarget(postgres, "HOSTELLO_TEST_DATABASE_URL");
  assert.deepEqual(
    migrationTarget,
    guardedTestTarget,
    "DATABASE_URL and HOSTELLO_TEST_DATABASE_URL must point to the same loopback test database",
  );
  assert.match(postgres, /RUN_AVAILABILITY_ALERTS_POSTGRES_TESTS:\s*["']?1["']?/);
  assert.match(postgres, /prisma migrate deploy/);
  assert.match(postgres, /availability-alerts\.postgres\.integration\.test\.ts/);
}

test("PostgreSQL CI gates are isolated and required before deployment", () => {
  const ciPostgres = jobSection(ciWorkflow, "postgres-integration");
  assertPostgresJob(ciPostgres);
  const preview = jobSection(ciWorkflow, "preview");
  assert.match(preview, /needs:\s*\[[^\]]*postgres-integration[^\]]*\]/);

  const productionPostgres = jobSection(productionWorkflow, "gate-postgres");
  assertPostgresJob(productionPostgres);
  const productionDeploy = jobSection(productionWorkflow, "deploy");
  assert.match(productionDeploy, /needs:\s*\[[^\]]*gate-postgres[^\]]*\]/);
});
