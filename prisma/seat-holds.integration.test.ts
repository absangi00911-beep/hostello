import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { Pool, type PoolClient } from "pg";
import { describe, expect, it } from "vitest";
import { getDisposableSeatHoldTestDatabaseUrl } from "../src/lib/disposable-seat-hold-db";

const requestedDatabaseUrl = process.env.HOSTELLO_SEAT_HOLD_TEST_DATABASE_URL;
const disposableConfirmation = process.env.HOSTELLO_SEAT_HOLD_TEST_DISPOSABLE;
const optedIn = requestedDatabaseUrl !== undefined || disposableConfirmation !== undefined;
const testDatabaseUrl = optedIn
  ? getDisposableSeatHoldTestDatabaseUrl({
      url: requestedDatabaseUrl,
      confirmation: disposableConfirmation,
      applicationDatabaseUrl: process.env.DATABASE_URL,
    })
  : undefined;

describe.skipIf(!testDatabaseUrl)("PostgreSQL seat-hold migration", () => {
  it("enforces overlapping seat exclusion and allows checkout/start boundary reuse", async () => {
    const pool = new Pool({ connectionString: testDatabaseUrl });
    let client: PoolClient | undefined;
    const schema = `seat_hold_test_${randomBytes(8).toString("hex")}`;
    try {
      client = await pool.connect();
      await client.query(`CREATE SCHEMA "${schema}"`);
      await client.query(`SET search_path TO "${schema}", public`);
      await client.query(`
        CREATE TABLE "rooms" (
          "id" TEXT PRIMARY KEY,
          "hostelId" TEXT NOT NULL,
          "capacity" INTEGER NOT NULL
        );
        CREATE TABLE "bookings" (
          "id" TEXT PRIMARY KEY,
          "hostelId" TEXT NOT NULL,
          "roomId" TEXT,
          "checkIn" TIMESTAMP(3) NOT NULL,
          "checkOut" TIMESTAMP(3) NOT NULL,
          "guests" INTEGER NOT NULL,
          "status" TEXT NOT NULL
        );
      `);

      const migration = readFileSync(
        "prisma/migrations/20261105000000_add_seat_holds/migration.sql",
        "utf8",
      );
      await client.query(migration);

      await client.query(
        `INSERT INTO "rooms" ("id", "hostelId", "capacity") VALUES ('room_1', 'hostel_1', 1)`,
      );
      await client.query(`
        INSERT INTO "bookings" ("id", "hostelId", "roomId", "checkIn", "checkOut", "guests", "status")
        VALUES
          ('booking_1', 'hostel_1', 'room_1', '2031-02-01', '2031-02-04', 1, 'CONFIRMED'),
          ('booking_2', 'hostel_1', 'room_1', '2031-02-02', '2031-02-03', 1, 'PENDING'),
          ('booking_3', 'hostel_1', 'room_1', '2031-02-04', '2031-02-05', 1, 'PENDING')
      `);
      await client.query(`
        INSERT INTO "seat_holds" ("id", "roomId", "seatNo", "bookingId", "checkIn", "checkOut")
        VALUES ('hold_1', 'room_1', 1, 'booking_1', '2031-02-01', '2031-02-04')
      `);

      await expect(client.query(`
        INSERT INTO "seat_holds" ("id", "roomId", "seatNo", "bookingId", "checkIn", "checkOut")
        VALUES ('hold_2', 'room_1', 1, 'booking_2', '2031-02-02', '2031-02-03')
      `)).rejects.toMatchObject({ code: "23P01" });

      await expect(client.query(`
        INSERT INTO "seat_holds" ("id", "roomId", "seatNo", "bookingId", "checkIn", "checkOut")
        VALUES ('hold_3', 'room_1', 1, 'booking_3', '2031-02-04', '2031-02-05')
      `)).resolves.toMatchObject({ rowCount: 1 });
    } finally {
      try {
        if (client) {
          try {
            await client.query("ROLLBACK");
            await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
          } finally {
            client.release();
          }
        }
      } finally {
        await pool.end();
      }
    }
  });
});
