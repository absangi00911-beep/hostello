import { spawnSync } from "node:child_process";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Required migration guard setting is missing: ${name}`);
  return value;
}

function parseDatabaseIdentity(value, name) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} is not a valid PostgreSQL URL.`);
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error(`${name} must use PostgreSQL.`);
  }

  const database = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  if (!url.hostname || !database) {
    throw new Error(`${name} must include a host and database name.`);
  }

  return { host: url.hostname.toLowerCase(), database };
}

try {
  if (process.env.HOSTELLO_MIGRATION_TARGET !== "preview") {
    throw new Error("This command only runs when HOSTELLO_MIGRATION_TARGET=preview.");
  }

  const actual = parseDatabaseIdentity(required("DATABASE_URL"), "DATABASE_URL");
  const preview = {
    host: required("HOSTELLO_PREVIEW_DATABASE_HOST").toLowerCase(),
    database: required("HOSTELLO_PREVIEW_DATABASE_NAME"),
  };
  const production = {
    host: required("HOSTELLO_PRODUCTION_DATABASE_HOST").toLowerCase(),
    database: required("HOSTELLO_PRODUCTION_DATABASE_NAME"),
  };

  const sameIdentity = (left, right) =>
    left.host === right.host && left.database === right.database;

  if (sameIdentity(preview, production)) {
    throw new Error("Configured Preview and Production database identities must differ.");
  }
  if (sameIdentity(actual, production)) {
    throw new Error("DATABASE_URL resolves to the configured Production database; refusing migration.");
  }
  if (!sameIdentity(actual, preview)) {
    throw new Error("DATABASE_URL does not match the configured Preview database; refusing migration.");
  }

  console.log("[preview-migrate] Database identity matches the configured Preview target.");
  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(command, ["run", "db:migrate:deploy"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error(`[preview-migrate] Could not start Prisma migration (${result.error.name}).`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
} catch (error) {
  console.error(`[preview-migrate] ${error instanceof Error ? error.message : "Migration guard failed."}`);
  process.exit(1);
}
