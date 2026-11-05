import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type PoolClient } from "pg";
import { describe, expect, it } from "vitest";
import { PrismaClient } from "../src/generated/client";
import { BookingServiceError, createBooking } from "../src/lib/booking-service";
import { getDisposableSeatHoldTestDatabaseUrl } from "../src/lib/disposable-seat-hold-db";
import {
  createOwnerBlockedDate,
  lockHostelInventory,
  releaseSeatHolds,
} from "../src/lib/room-availability-service";
import { syncHostelRooms } from "../src/lib/room-inventory-service";

const requestedDatabaseUrl = process.env.HOSTELLO_SEAT_HOLD_TEST_DATABASE_URL;
const disposableConfirmation = process.env.HOSTELLO_SEAT_HOLD_TEST_DISPOSABLE;
const optedIn = requestedDatabaseUrl !== undefined || disposableConfirmation !== undefined;
const testDatabaseUrl = optedIn
  ? getDisposableSeatHoldTestDatabaseUrl({
      url: requestedDatabaseUrl,
      confirmation: disposableConfirmation,
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

describe.skipIf(!testDatabaseUrl)("PostgreSQL production-path seat-hold races", () => {
  const hostelId = "hostel_1";
  const ownerId = "owner_1";
  const studentId = "student_1";
  const roomId = "room_1";

  async function createInventoryFixture(capacity = 2) {
    if (!testDatabaseUrl) throw new Error("Disposable PostgreSQL target is not configured.");
    const schema = `seat_hold_race_${randomBytes(8).toString("hex")}`;
    const pool = new Pool({ connectionString: testDatabaseUrl, max: 10 });
    let client: PoolClient | undefined;
    let adapterPool: Pool | undefined;
    let prisma: PrismaClient | undefined;
    try {
      client = await pool.connect();
      await client.query(`CREATE SCHEMA "${schema}"`);
      await client.query("CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public");
      await client.query(`SET search_path TO "${schema}", public`);
      await client.query(`
        CREATE TYPE "Role" AS ENUM ('STUDENT', 'OWNER', 'ADMIN');
        CREATE TYPE "HostelStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'SUSPENDED');
        CREATE TYPE "CancellationPolicy" AS ENUM ('FLEXIBLE', 'STANDARD', 'STRICT');
        CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
        CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED');
        CREATE TYPE "RefundState" AS ENUM ('NONE', 'PROCESSING', 'UNCERTAIN', 'PARTIALLY_REFUNDED', 'REFUNDED');

        CREATE TABLE "users" (
          "id" TEXT PRIMARY KEY,
          "email" TEXT NOT NULL UNIQUE,
          "name" TEXT NOT NULL,
          "role" "Role" NOT NULL DEFAULT 'STUDENT',
          "deletionRequestedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE "hostels" (
          "id" TEXT PRIMARY KEY,
          "name" TEXT NOT NULL,
          "slug" TEXT NOT NULL UNIQUE,
          "ownerId" TEXT NOT NULL REFERENCES "users"("id"),
          "status" "HostelStatus" NOT NULL DEFAULT 'DRAFT',
          "pricePerMonth" INTEGER NOT NULL,
          "cancellationPolicy" "CancellationPolicy",
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE "rooms" (
          "id" TEXT PRIMARY KEY,
          "hostelId" TEXT NOT NULL REFERENCES "hostels"("id") ON DELETE CASCADE,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "pricePerMonth" INTEGER NOT NULL,
          "capacity" INTEGER NOT NULL,
          "available" INTEGER NOT NULL,
          "version" INTEGER NOT NULL DEFAULT 0,
          "images" TEXT[] NOT NULL DEFAULT '{}',
          "facilities" TEXT[] NOT NULL DEFAULT '{}',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE "bookings" (
          "id" TEXT PRIMARY KEY,
          "hostelId" TEXT NOT NULL REFERENCES "hostels"("id"),
          "roomId" TEXT REFERENCES "rooms"("id"),
          "userId" TEXT NOT NULL REFERENCES "users"("id"),
          "checkIn" TIMESTAMP(3) NOT NULL,
          "checkOut" TIMESTAMP(3) NOT NULL,
          "months" INTEGER NOT NULL,
          "guests" INTEGER NOT NULL DEFAULT 1,
          "total" INTEGER NOT NULL,
          "cancellationPolicy" "CancellationPolicy",
          "cancellationRefundAmount" INTEGER,
          "refundedAmount" INTEGER NOT NULL DEFAULT 0,
          "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
          "paymentMethod" TEXT,
          "transactionId" TEXT UNIQUE,
          "refundState" "RefundState" NOT NULL DEFAULT 'NONE',
          "refundedAt" TIMESTAMP(3),
          "refundedBy" TEXT,
          "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
          "ownerResponseDueAt" TIMESTAMP(3),
          "ownerResponseReminderSentAt" TIMESTAMP(3),
          "notes" TEXT,
          "payoutId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE "blocked_dates" (
          "id" TEXT PRIMARY KEY,
          "hostelId" TEXT NOT NULL REFERENCES "hostels"("id") ON DELETE CASCADE,
          "startDate" TIMESTAMP(3) NOT NULL,
          "endDate" TIMESTAMP(3) NOT NULL,
          "reason" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO "users" ("id", "email", "name", "role")
        VALUES
          ('${ownerId}', 'owner@example.test', 'Owner', 'OWNER'),
          ('${studentId}', 'student@example.test', 'Student', 'STUDENT');
        INSERT INTO "hostels" ("id", "name", "slug", "ownerId", "status", "pricePerMonth", "cancellationPolicy")
        VALUES ('${hostelId}', 'Test Hostel', 'test-hostel', '${ownerId}', 'ACTIVE', 1000, 'STANDARD');
        INSERT INTO "rooms" ("id", "hostelId", "name", "pricePerMonth", "capacity", "available")
        VALUES ('${roomId}', '${hostelId}', 'Test Room', 1000, ${capacity}, ${capacity});
      `);

      const migration = readFileSync(
        "prisma/migrations/20261105000000_add_seat_holds/migration.sql",
        "utf8",
      );
      await client.query(migration);
      client.release();
      client = undefined;

      adapterPool = new Pool({
        connectionString: testDatabaseUrl,
        options: `-c search_path=${schema},public`,
        max: 8,
      });
      prisma = new PrismaClient({ adapter: new PrismaPg(adapterPool, { schema }) });

      return {
        prisma,
        async cleanup() {
          await prisma?.$disconnect();
          await adapterPool?.end();
          const cleanupClient = await pool.connect();
          try {
            await cleanupClient.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
          } finally {
            cleanupClient.release();
            await pool.end();
          }
        },
      };
    } catch (error) {
      await prisma?.$disconnect().catch(() => undefined);
      await adapterPool?.end().catch(() => undefined);
      if (client) {
        try {
          await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
        } finally {
          client.release();
        }
      } else {
        await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`).catch(() => undefined);
      }
      await pool.end();
      throw error;
    }
  }

  function bookingInput(checkIn: string, checkOut: string, guests = 1) {
    return {
      hostelId,
      roomId,
      checkIn: new Date(`${checkIn}T00:00:00.000Z`),
      checkOut: new Date(`${checkOut}T00:00:00.000Z`),
      guests,
      paymentMethod: "safepay" as const,
    };
  }

  async function attemptBooking(
    prisma: PrismaClient,
    checkIn: string,
    checkOut: string,
    guests = 1,
  ) {
    try {
      await createBooking(studentId, bookingInput(checkIn, checkOut, guests), prisma);
      return true;
    } catch (error) {
      if (error instanceof BookingServiceError) return false;
      throw error;
    }
  }

  async function cancelAndRelease(prisma: PrismaClient, bookingId: string) {
    return prisma.$transaction(async (tx) => {
      const transitioned = await tx.booking.updateMany({
        where: { id: bookingId, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
      if (transitioned.count !== 1) return false;
      await releaseSeatHolds(tx, bookingId);
      return true;
    });
  }

  async function createGate() {
    let release!: () => void;
    let signal!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const locked = new Promise<void>((resolve) => { signal = resolve; });
    return { gate, locked, release, signal };
  }

  it("allows exactly one concurrent production booking to allocate the last seat", async () => {
    const fixture = await createInventoryFixture(1);
    try {
      const outcomes = await Promise.all([
        attemptBooking(fixture.prisma, "2032-01-01", "2032-01-04"),
        attemptBooking(fixture.prisma, "2032-01-02", "2032-01-03"),
      ]);

      expect(outcomes.filter(Boolean)).toHaveLength(1);
      expect(await fixture.prisma.seatHold.count()).toBe(1);
    } finally {
      await fixture.cleanup();
    }
  });

  it("releases production holds on cancellation and keeps half-open checkout boundary reuse", async () => {
    const fixture = await createInventoryFixture(1);
    try {
      const cancelled = await createBooking(
        studentId,
        bookingInput("2032-02-01", "2032-02-04"),
        fixture.prisma,
      );
      expect(await cancelAndRelease(fixture.prisma, cancelled.id)).toBe(true);
      expect(await fixture.prisma.seatHold.count({ where: { bookingId: cancelled.id } })).toBe(0);
      expect(await attemptBooking(fixture.prisma, "2032-02-02", "2032-02-03")).toBe(true);

      const checkout = await createBooking(
        studentId,
        bookingInput("2032-02-04", "2032-02-06"),
        fixture.prisma,
      );
      expect(await attemptBooking(fixture.prisma, "2032-02-06", "2032-02-07")).toBe(true);
      expect(await fixture.prisma.seatHold.count({ where: { bookingId: checkout.id } })).toBe(1);
    } finally {
      await fixture.cleanup();
    }
  });

  it("serializes the production owner-block path against booking allocation", async () => {
    const fixture = await createInventoryFixture();
    const synchronization = await createGate();
    const blockWrite = fixture.prisma.$transaction(async (tx) => {
      await lockHostelInventory(tx, hostelId);
      synchronization.signal();
      await synchronization.gate;
      return createOwnerBlockedDate(tx, {
        hostelId,
        ownerId,
        startDate: new Date("2032-03-10T00:00:00.000Z"),
        endDate: new Date("2032-03-11T00:00:00.000Z"),
        reason: "Repairs",
      });
    });

    try {
      await synchronization.locked;
      const booking = attemptBooking(fixture.prisma, "2032-03-11", "2032-03-12");
      synchronization.release();
      await expect(blockWrite).resolves.toMatchObject({ kind: "created" });
      await expect(booking).resolves.toBe(false);
    } finally {
      synchronization.release();
      await blockWrite.catch(() => undefined);
      await fixture.cleanup();
    }
  });

  it("serializes production capacity edits against booking allocation", async () => {
    const fixture = await createInventoryFixture(2);
    const synchronization = await createGate();
    const capacityEdit = fixture.prisma.$transaction(async (tx) => {
      await lockHostelInventory(tx, hostelId);
      synchronization.signal();
      await synchronization.gate;
      await syncHostelRooms(tx, hostelId, [{
        id: roomId,
        name: "Test Room",
        description: null,
        pricePerMonth: 1000,
        capacity: 1,
        facilities: [],
        images: [],
      }]);
    });

    try {
      await synchronization.locked;
      const booking = attemptBooking(fixture.prisma, "2032-04-01", "2032-04-05", 2);
      synchronization.release();
      await capacityEdit;
      await expect(booking).resolves.toBe(false);
    } finally {
      synchronization.release();
      await capacityEdit.catch(() => undefined);
      await fixture.cleanup();
    }
  });

  it("preserves confirmed occupancy, releases declined holds, and retains completed holds until checkout", async () => {
    const fixture = await createInventoryFixture(1);
    try {
      const confirmed = await createBooking(
        studentId,
        bookingInput("2032-05-01", "2032-05-05"),
        fixture.prisma,
      );
      await fixture.prisma.booking.update({
        where: { id: confirmed.id },
        data: { status: "CONFIRMED" },
      });
      expect(await attemptBooking(fixture.prisma, "2032-05-01", "2032-05-05")).toBe(false);

      const declined = await createBooking(
        studentId,
        bookingInput("2032-05-05", "2032-05-06"),
        fixture.prisma,
      );
      expect(await cancelAndRelease(fixture.prisma, declined.id)).toBe(true);

      await fixture.prisma.booking.update({
        where: { id: confirmed.id },
        data: { status: "COMPLETED" },
      });
      expect(await attemptBooking(fixture.prisma, "2032-05-05", "2032-05-06")).toBe(true);
      expect(await fixture.prisma.seatHold.count({ where: { bookingId: confirmed.id } })).toBe(1);
    } finally {
      await fixture.cleanup();
    }
  });
});
