#!/usr/bin/env node
/**
 * Fails when SYSTEM.md (and the docs it links) drift from the code.
 *
 *   node scripts/check-docs.mjs            check, exit 1 on any problem
 *   node scripts/check-docs.mjs --write    regenerate the repository-facts block first
 *
 * Checks
 *   1. The generated "Repository facts" table matches the filesystem.
 *   2. Every API route file is documented in SYSTEM.md by its /api path.
 *   3. Every cron job in src/lib/cron-schedules.ts is documented.
 *   4. Every environment variable the code reads is in .env.example (or the
 *      sentry example), and every variable in those files is documented.
 *   5. Relative Markdown links in SYSTEM.md, CHANGELOG.md and docs/*.md resolve.
 *
 * No dependencies. Run from the repository root.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname, resolve, sep } from "node:path";

const ROOT = process.cwd();
const WRITE = process.argv.includes("--write");
const DOC = join(ROOT, "SYSTEM.md");
const BEGIN = "<!-- docs-check:begin -->";
const END = "<!-- docs-check:end -->";

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "generated", "dist", "coverage"]);
const read = (p) => readFileSync(p, "utf8").replace(/\r/g, "");

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const rel = (p) => relative(ROOT, p).split(sep).join("/");

// ---------- gather facts ----------
const apiRoot = join(ROOT, "src/app/api");
const routeFiles = walk(apiRoot).filter((p) => p.endsWith(`${sep}route.ts`));
const routePaths = routeFiles.map((p) => "/api/" + rel(dirname(p)).replace(/^src\/app\/api\/?/, "")).map((p) => p.replace(/\/$/, ""));
const pageFiles = walk(join(ROOT, "src/app")).filter((p) => /[\\/]page\.(t|j)sx?$/.test(p));
const schema = existsSync(join(ROOT, "prisma/schema.prisma")) ? read(join(ROOT, "prisma/schema.prisma")) : "";
const modelCount = (schema.match(/^model\s+/gm) || []).length;
const migDir = join(ROOT, "prisma/migrations");
const migrations = existsSync(migDir) ? readdirSync(migDir).filter((n) => statSync(join(migDir, n)).isDirectory()) : [];
const testFiles = walk(join(ROOT, "src")).filter((p) => /\.test\.(t|j)sx?$/.test(p));
const cronSrc = existsSync(join(ROOT, "src/lib/cron-schedules.ts")) ? read(join(ROOT, "src/lib/cron-schedules.ts")) : "";
const cronEndpoints = [...cronSrc.matchAll(/endpoint:\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]);
const cronRouteDirs = existsSync(join(apiRoot, "cron")) ? readdirSync(join(apiRoot, "cron")).filter((n) => statSync(join(apiRoot, "cron", n)).isDirectory()) : [];

const factsTable = [
  "| Fact | Value |",
  "|---|---:|",
  `| Page files (\`src/app/**/page.tsx\`) | ${pageFiles.length} |`,
  `| API route handler files | ${routeFiles.length} |`,
  `| Prisma models | ${modelCount} |`,
  `| Prisma migrations | ${migrations.length} |`,
  `| Vitest test files | ${testFiles.length} |`,
  `| Cron jobs in the schedule registry | ${cronEndpoints.length} |`,
  `| Cron route handlers | ${cronRouteDirs.length} |`,
].join("\n");

// ---------- load doc ----------
if (!existsSync(DOC)) {
  console.error("SYSTEM.md not found in", ROOT);
  process.exit(1);
}
let doc = read(DOC);
const problems = [];

if (!doc.includes(BEGIN) || !doc.includes(END)) {
  problems.push(`SYSTEM.md must contain ${BEGIN} and ${END} around the repository-facts table.`);
} else {
  const current = doc.slice(doc.indexOf(BEGIN) + BEGIN.length, doc.indexOf(END)).trim();
  if (WRITE) {
    doc = doc.slice(0, doc.indexOf(BEGIN) + BEGIN.length) + "\n" + factsTable + "\n" + doc.slice(doc.indexOf(END));
    writeFileSync(DOC, doc);
    console.log("Updated the repository-facts block in SYSTEM.md");
  } else if (current !== factsTable) {
    problems.push("Repository-facts table is out of date. Run: node scripts/check-docs.mjs --write\n" +
      "  expected:\n" + factsTable.split("\n").map((l) => "    " + l).join("\n"));
  }
}

// ---------- 2. routes ----------
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
for (const p of routePaths) {
  const re = new RegExp(esc(p) + "(?![A-Za-z0-9_\\[\\]\\-/])");
  if (!re.test(doc)) problems.push(`Route not documented in SYSTEM.md: ${p}`);
}

// ---------- 3. cron ----------
for (const ep of cronEndpoints) {
  const name = ep.split("/").pop();
  if (!doc.includes("`" + name + "`")) problems.push(`Cron job not documented in SYSTEM.md: ${name}`);
}

// ---------- 4. environment variables ----------
const IGNORE = new Set([
  "NODE_ENV", "NEXT_PHASE", "NEXT_RUNTIME", "VERCEL", "VERCEL_ENV", "VERCEL_URL", "VERCEL_GIT_COMMIT_SHA",
  "CI", "VITEST", "npm_package_version", "PORT", "TZ", "DEBUG",
]);
const codeFiles = [
  ...walk(join(ROOT, "src")), ...walk(join(ROOT, "scripts")), ...walk(join(ROOT, "prisma")),
  ...walk(join(ROOT, "packages/shared/src")),
  ...["next.config.ts", "instrumentation.ts", "instrumentation-client.ts", "sentry.server.config.ts", "sentry.edge.config.ts", "prisma.config.ts"].map((f) => join(ROOT, f)),
].filter((p) => /\.(ts|tsx|mjs|js)$/.test(p) && !/\.test\./.test(p) && existsSync(p));
const used = new Set();
for (const f of codeFiles) {
  const t = read(f);
  for (const m of t.matchAll(/process\.env\.([A-Z][A-Z0-9_]+)/g)) used.add(m[1]);
  for (const m of t.matchAll(/process\.env\[\s*["']([A-Z][A-Z0-9_]+)["']\s*\]/g)) used.add(m[1]);
}
const declared = new Set();
for (const f of [".env.example", ".env.sentry.example"]) {
  const p = join(ROOT, f);
  if (!existsSync(p)) continue;
  for (const m of read(p).matchAll(/^#?\s*([A-Z][A-Z0-9_]{2,})\s*[=:]/gm)) declared.add(m[1]);
}
for (const v of [...used].sort()) {
  if (IGNORE.has(v) || declared.has(v)) continue;
  if (!doc.includes("`" + v + "`")) problems.push(`Env var read by code but in neither .env.example nor SYSTEM.md: ${v}`);
}
for (const v of [...declared].sort()) {
  if (IGNORE.has(v)) continue;
  if (!doc.includes("`" + v + "`")) problems.push(`Env var in .env.example but not documented in SYSTEM.md: ${v}`);
}

// ---------- 5. relative links ----------
const mdFiles = ["SYSTEM.md", "CHANGELOG.md", ...walk(join(ROOT, "docs")).filter((p) => p.endsWith(".md")).map(rel)]
  .filter((f, i, a) => a.indexOf(f) === i && existsSync(join(ROOT, f)));
for (const f of mdFiles) {
  const t = read(join(ROOT, f)).replace(/```[\s\S]*?```/g, "");
  for (const m of t.matchAll(/\]\(([^)\s]+)\)/g)) {
    const target = m[1];
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const path = resolve(dirname(join(ROOT, f)), target.split("#")[0]);
    if (!existsSync(path)) problems.push(`Broken link in ${f}: ${target}`);
  }
}

// ---------- report ----------
if (problems.length) {
  console.error(`docs check failed (${problems.length} problem${problems.length === 1 ? "" : "s"}):\n`);
  for (const p of problems) console.error(" - " + p);
  process.exit(1);
}
console.log(`docs check passed: ${routePaths.length} routes, ${cronEndpoints.length} cron jobs, ${used.size} env vars read, ${mdFiles.length} Markdown files linked.`);
