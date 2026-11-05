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

describe.skipIf(!testDatabaseUrl)("PostgreSQL seat-hold booking races", () => {
  async function createInventorySchema(pool: Pool, capacity = 2) {
    const schema = `seat_hold_race_${randomBytes(8).toString("hex")}`;
    const client = await pool.connect();
    try {
      await client.query(`CREATE SCHEMA "${schema}"`);
      await client.query("CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public");
      await client.query(`SET search_path TO "${schema}", public`);
      await client.query(`
        CREATE TABLE "hostels" ("id" TEXT PRIMARY KEY);
        CREATE TABLE "rooms" (
          "id" TEXT PRIMARY KEY,
          "hostelId" TEXT NOT NULL,
          "capacity" INTEGER NOT NULL
        );
        CREATE TABLE "bookings" (
          "id" TEXT PRIMARY KEY,
          "status" TEXT NOT NULL,
          "checkIn" DATE NOT NULL,
          "checkOut" DATE NOT NULL,
          "guests" INTEGER NOT NULL
        );
        CREATE TABLE "blocked_dates" (
          "id" TEXT PRIMARY KEY,
          "hostelId" TEXT NOT NULL,
          "startDate" DATE NOT NULL,
          "endDate" DATE NOT NULL
        );
        CREATE TABLE "seat_holds" (
          "id" TEXT PRIMARY KEY,
          "roomId" TEXT NOT NULL,
          "seatNo" INTEGER NOT NULL,
          "bookingId" TEXT NOT NULL,
          "checkIn" DATE NOT NULL,
          "checkOut" DATE NOT NULL,
          UNIQUE ("bookingId", "seatNo"),
          EXCLUDE USING gist (
            "roomId" WITH =,
            daterange("checkIn", "checkOut", '[)') WITH &&,
            "seatNo" WITH =
          )
        );
        INSERT INTO "hostels" ("id") VALUES ('hostel_1');
        INSERT INTO "rooms" ("id", "hostelId", "capacity") VALUES ('room_1', 'hostel_1', ${capacity});
      `);
    } finally {
      client.release();
    }

    return {
      schema,
      async connect() {
        const connection = await pool.connect();
        await connection.query(`SET search_path TO "${schema}", public`);
        return connection;
      },
    };
  }

  async function cleanupInventorySchema(pool: Pool, schema: string) {
    const client = await pool.connect();
    try {
      await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    } finally {
      client.release();
    }
  }

  async function reserveStay(
    client: PoolClient,
    bookingId: string,
    checkIn: string,
    checkOut: string,
    guests = 1,
  ) {
    await client.query("BEGIN");
    try {
      await client.query(`SELECT "id" FROM "hostels" WHERE "id" = 'hostel_1' FOR UPDATE`);
      const room = await client.query<{ capacity: number }>(
        `SELECT "capacity" FROM "rooms" WHERE "id" = 'room_1' FOR UPDATE`,
      );
      const block = await client.query(
        `SELECT 1 FROM "blocked_dates"
         WHERE "hostelId" = 'hostel_1' AND "startDate" < $2::date AND "endDate" >= $1::date
         LIMIT 1`,
        [checkIn, checkOut],
      );
      if (block.rowCount) {
        await client.query("ROLLBACK");
        return false;
      }

      const occupied = await client.query<{ seatNo: number }>(
        `SELECT DISTINCT "seatNo" FROM "seat_holds"
         WHERE "roomId" = 'room_1' AND "checkIn" < $2::date AND "checkOut" > $1::date`,
        [checkIn, checkOut],
      );
      const occupiedSeats = new Set(occupied.rows.map((row) => row.seatNo));
      const seatNumbers = Array.from({ length: room.rows[0].capacity }, (_, index) => index + 1)
        .filter((seatNo) => !occupiedSeats.has(seatNo))
        .slice(0, guests);
      if (seatNumbers.length !== guests) {
        await client.query("ROLLBACK");
        return false;
      }

      await client.query(
        `INSERT INTO "bookings" ("id", "status", "checkIn", "checkOut", "guests")
         VALUES ($1, 'PENDING', $2::date, $3::date, $4)`,
        [bookingId, checkIn, checkOut, guests],
      );
      for (const seatNo of seatNumbers) {
        await client.query(
          `INSERT INTO "seat_holds" ("id", "roomId", "seatNo", "bookingId", "checkIn", "checkOut")
           VALUES ($1, 'room_1', $2, $3, $4::date, $5::date)`,
          [`hold_${bookingId}_${seatNo}`, seatNo, bookingId, checkIn, checkOut],
        );
      }
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      if ((error as { code?: string }).code === "23P01") return false;
      throw error;
    }
  }

  async function transitionAndRelease(client: PoolClient, bookingId: string, nextStatus: string) {
    await client.query("BEGIN");
    try {
      const transition = await client.query(
        `UPDATE "bookings" SET "status" = $2 WHERE "id" = $1 AND "status" = 'PENDING'`,
        [bookingId, nextStatus],
      );
      if (transition.rowCount !== 1) {
        await client.query("ROLLBACK");
        return false;
      }
      if (nextStatus === "CANCELLED") {
        await client.query(`DELETE FROM "seat_holds" WHERE "bookingId" = $1`, [bookingId]);
      }
      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }

  it("allows exactly one concurrent booking to allocate the last seat", async () => {
    const pool = new Pool({ connectionString: testDatabaseUrl });
    const fixture = await createInventorySchema(pool, 1);
    const first = await fixture.connect();
    const second = await fixture.connect();
    try {
      const outcomes = await Promise.all([
        reserveStay(first, "booking_a", "2032-01-01", "2032-01-04"),
        reserveStay(second, "booking_b", "2032-01-02", "2032-01-03"),
      ]);

      expect(outcomes.filter(Boolean)).toHaveLength(1);
      const held = await first.query(`SELECT COUNT(*)::int AS count FROM "seat_holds"`);
      expect(held.rows[0].count).toBe(1);
    } finally {
      first.release();
      second.release();
      await cleanupInventorySchema(pool, fixture.schema);
      await pool.end();
    }
  });

  it("releases cancellation and expiry holds, and permits checkout-boundary reuse", async () => {
    const pool = new Pool({ connectionString: testDatabaseUrl });
    const fixture = await createInventorySchema(pool, 1);
    const client = await fixture.connect();
    try {
      expect(await reserveStay(client, "booking_cancelled", "2032-02-01", "2032-02-04")).toBe(true);
      expect(await transitionAndRelease(client, "booking_cancelled", "CANCELLED")).toBe(true);
      expect(await reserveStay(client, "booking_rebooked", "2032-02-02", "2032-02-03")).toBe(true);
      expect(await transitionAndRelease(client, "booking_rebooked", "CANCELLED")).toBe(true);
      expect(await reserveStay(client, "booking_checkout", "2032-02-01", "2032-02-04")).toBe(true);
      expect(await reserveStay(client, "booking_after_checkout", "2032-02-04", "2032-02-05")).toBe(true);

      const overlapsAfterCheckout = await client.query(
        `SELECT COUNT(*)::int AS count FROM "seat_holds"
         WHERE "roomId" = 'room_1' AND "checkIn" < '2032-02-05'
           AND "checkOut" > '2032-02-04'`,
      );
      expect(overlapsAfterCheckout.rows[0].count).toBe(1);
      expect(await transitionAndRelease(client, "booking_checkout", "CANCELLED")).toBe(true);
      expect(await reserveStay(client, "booking_expired", "2032-02-02", "2032-02-03")).toBe(true);
      expect(await transitionAndRelease(client, "booking_expired", "CANCELLED")).toBe(true);
    } finally {
      client.release();
      await cleanupInventorySchema(pool, fixture.schema);
      await pool.end();
    }
  });

  it("serializes an owner block against booking allocation", async () => {
    const pool = new Pool({ connectionString: testDatabaseUrl });
    const fixture = await createInventorySchema(pool);
    const blockClient = await fixture.connect();
    const bookingClient = await fixture.connect();
    let releaseBlock!: () => void;
    let signalLock!: () => void;
    const blockGate = new Promise<void>((resolve) => { releaseBlock = resolve; });
    const locked = new Promise<void>((resolve) => { signalLock = resolve; });
    const blockWrite = (async () => {
      await blockClient.query("BEGIN");
      await blockClient.query(`SELECT "id" FROM "hostels" WHERE "id" = 'hostel_1' FOR UPDATE`);
      signalLock();
      await blockGate;
      await blockClient.query(
        `INSERT INTO "blocked_dates" ("id", "hostelId", "startDate", "endDate")
         VALUES ('block_1', 'hostel_1', '2032-03-10', '2032-03-11')`,
      );
      await blockClient.query("COMMIT");
    })();

    try {
      await locked;
      const booking = reserveStay(bookingClient, "booking_during_block", "2032-03-11", "2032-03-12");
      releaseBlock();
      await blockWrite;
      await expect(booking).resolves.toBe(false);
    } finally {
      releaseBlock();
      await blockWrite.catch(() => undefined);
      blockClient.release();
      bookingClient.release();
      await cleanupInventorySchema(pool, fixture.schema);
      await pool.end();
    }
  });

  it("serializes capacity edits against booking allocation", async () => {
    const pool = new Pool({ connectionString: testDatabaseUrl });
    const fixture = await createInventorySchema(pool);
    const editClient = await fixture.connect();
    const bookingClient = await fixture.connect();
    let releaseEdit!: () => void;
    let signalLock!: () => void;
    const editGate = new Promise<void>((resolve) => { releaseEdit = resolve; });
    const locked = new Promise<void>((resolve) => { signalLock = resolve; });
    const capacityEdit = (async () => {
      await editClient.query("BEGIN");
      await editClient.query(`SELECT "id" FROM "hostels" WHERE "id" = 'hostel_1' FOR UPDATE`);
      await editClient.query(`SELECT "id" FROM "rooms" WHERE "id" = 'room_1' FOR UPDATE`);
      signalLock();
      await editGate;
      await editClient.query(`UPDATE "rooms" SET "capacity" = 1 WHERE "id" = 'room_1'`);
      await editClient.query("COMMIT");
    })();

    try {
      await locked;
      const booking = reserveStay(bookingClient, "booking_stale_capacity", "2032-04-01", "2032-04-05", 2);
      releaseEdit();
      await capacityEdit;
      await expect(booking).resolves.toBe(false);
    } finally {
      releaseEdit();
      await capacityEdit.catch(() => undefined);
      editClient.release();
      bookingClient.release();
      await cleanupInventorySchema(pool, fixture.schema);
      await pool.end();
    }
  });

  it("preserves occupancy for confirmed stays and releases declined or expired requests", async () => {
    const pool = new Pool({ connectionString: testDatabaseUrl });
    const fixture = await createInventorySchema(pool, 1);
    const client = await fixture.connect();
    try {
      expect(await reserveStay(client, "booking_confirmed", "2032-05-01", "2032-05-05")).toBe(true);
      await client.query(`UPDATE "bookings" SET "status" = 'CONFIRMED' WHERE "id" = 'booking_confirmed'`);
      const confirmedHolds = await client.query(
        `SELECT COUNT(*)::int AS count FROM "seat_holds" WHERE "bookingId" = 'booking_confirmed'`,
      );
      expect(confirmedHolds.rows[0].count).toBe(1);

      expect(await reserveStay(client, "booking_declined", "2032-05-05", "2032-05-06")).toBe(true);
      expect(await transitionAndRelease(client, "booking_declined", "CANCELLED")).toBe(true);
      expect(await reserveStay(client, "booking_expired", "2032-05-01", "2032-05-05")).toBe(false);

      await transitionAndRelease(client, "booking_confirmed", "COMPLETED");
      const nextStay = await reserveStay(client, "booking_after_checkout", "2032-05-05", "2032-05-06");
      expect(nextStay).toBe(true);
      const bookingHolds = await client.query(
        `SELECT COUNT(*)::int AS count FROM "seat_holds" WHERE "bookingId" = 'booking_confirmed'`,
      );
      expect(bookingHolds.rows[0].count).toBe(1);
    } finally {
      client.release();
      await cleanupInventorySchema(pool, fixture.schema);
      await pool.end();
    }
  });
});
