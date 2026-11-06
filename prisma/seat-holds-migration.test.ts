import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "prisma/migrations/20261105000000_add_seat_holds/migration.sql",
);

describe("seat-hold migration artifact", () => {
  it("requires btree_gist and prevents overlapping [checkIn, checkOut) seat assignments", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toMatch(/CREATE EXTENSION IF NOT EXISTS btree_gist/i);
    expect(sql).toMatch(/END;\s*\$preflight\$/);
    expect(sql).toMatch(/END;\s*\$backfill\$/);
    expect(sql).toMatch(/EXCLUDE USING gist/i);
    expect(sql).toMatch(/"roomId"\s+WITH\s*=/i);
    expect(sql).toMatch(/"seatNo"\s+WITH\s*=/i);
    expect(sql).toMatch(/daterange\(\s*"checkIn"\s*,\s*"checkOut"\s*,\s*'\[\)'\s*\)\s+WITH\s+&&/i);
    expect(sql).not.toMatch(/"during"\s+daterange/i);
  });

  it("repeats legacy booking checks before creating or backfilling seat holds", () => {
    const sql = readFileSync(migrationPath, "utf8");
    const preflightIndex = sql.indexOf("seat-hold migration preflight blocked");
    const extensionIndex = sql.indexOf("CREATE EXTENSION");
    const tableIndex = sql.indexOf('CREATE TABLE "seat_holds"');
    const backfillIndex = sql.indexOf("seat-hold backfill");

    expect(preflightIndex).toBeGreaterThanOrEqual(0);
    expect(extensionIndex).toBeGreaterThan(preflightIndex);
    expect(tableIndex).toBeGreaterThan(extensionIndex);
    expect(backfillIndex).toBeGreaterThan(tableIndex);
    expect(sql).toMatch(/"roomId"\s+IS\s+NULL/i);
    expect(sql).toMatch(/\(NOT isfinite\(b\."checkOut"\)\s+OR\s+b\."checkOut"::date > CURRENT_DATE\)/i);
    expect(sql).toMatch(/"checkOut"::date\s*<=\s*b\."checkIn"::date/i);
    expect(sql).toMatch(/guests\s*<=\s*0/i);
    expect(sql).toMatch(/"roomHostelId"|r\."hostelId"\s+IS\s+DISTINCT\s+FROM\s+b\."hostelId"/i);
    expect(sql).toMatch(/over_capacity_rooms/i);
  });
});
