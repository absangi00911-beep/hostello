import { randomUUID } from "node:crypto";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { PrismaClient, type Prisma } from "@/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

vi.mock("@/lib/db", () => ({ db: {} }));

import {
  createAvailabilityAlert,
  evaluateAvailabilityAlert,
} from "@/lib/availability-alerts";
import {
  createSeatHolds,
  lockAvailabilityInventory,
} from "@/lib/room-availability-service";

const enabled = process.env.RUN_AVAILABILITY_ALERTS_POSTGRES_TESTS === "1";
const checkIn = new Date("2099-04-10T00:00:00.000Z");
const checkOut = new Date("2099-04-12T00:00:00.000Z");

function getSafeTestConnectionString(value: string | undefined) {
  if (!value) {
    throw new Error("Set HOSTELLO_TEST_DATABASE_URL to an already-migrated disposable loopback *_test database.");
  }
  const parsed = new URL(value);
  const databaseName = decodeURIComponent(parsed.pathname.slice(1));
  if (
    !["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsed.hostname) ||
    !databaseName.endsWith("_test")
  ) {
    throw new Error("PostgreSQL alert integration tests allow only a loopback database whose name ends in _test.");
  }
  return value;
}

describe.skipIf(!enabled)("availability alerts PostgreSQL concurrency", () => {
  let pool: Pool;
  let prisma: PrismaClient;
  let ownerId: string;
  let studentId: string;
  let hostelId: string;
  let roomId: string;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: getSafeTestConnectionString(
        process.env.HOSTELLO_TEST_DATABASE_URL,
      ),
      max: 5,
    });
    await pool.query("SELECT 1");
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
    if (pool) await pool.end();
  });

  beforeEach(async () => {
    const suffix = randomUUID();
    const owner = await prisma.user.create({
      data: {
        email: `alert-owner-${suffix}@example.test`,
        name: "Alert Test Owner",
        role: "OWNER",
      },
    });
    const student = await prisma.user.create({
      data: {
        email: `alert-student-${suffix}@example.test`,
        name: "Alert Test Student",
        role: "STUDENT",
      },
    });
    ownerId = owner.id;
    studentId = student.id;
    const hostel = await prisma.hostel.create({
      data: {
        ownerId,
        name: "Availability Integration Hostel",
        slug: `availability-${suffix}`,
        description: "Disposable integration-test inventory.",
        status: "ACTIVE",
        city: "Lahore",
        address: "Test Road",
        pricePerMonth: 10_000,
        rooms: 1,
        capacity: 1,
        amenities: [],
        rules: [],
        images: [],
        cancellationPolicy: "FLEXIBLE",
      },
    });
    hostelId = hostel.id;
    const room = await prisma.room.create({
      data: {
        hostelId,
        name: "Single room",
        pricePerMonth: 10_000,
        capacity: 1,
        available: 1,
        images: [],
      },
    });
    roomId = room.id;
  });

  afterEach(async () => {
    if (!prisma || !hostelId) return;
    await prisma.notification.deleteMany({ where: { userId: studentId } });
    await prisma.availabilityAlert.deleteMany({ where: { userId: studentId } });
    await prisma.booking.deleteMany({ where: { hostelId } });
    await prisma.hostel.deleteMany({ where: { id: hostelId } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, studentId] } } });
  });

  async function createHeldSeat() {
    await prisma.$transaction(async (tx) => {
      await lockAvailabilityInventory(tx);
      const booking = await tx.booking.create({
        data: {
          userId: studentId,
          hostelId,
          roomId,
          checkIn,
          checkOut,
          months: 1,
          total: 10_000,
          paymentMethod: "test",
        },
      });
      await createSeatHolds(tx, {
        bookingId: booking.id,
        roomId,
        checkIn,
        checkOut,
        seatNumbers: [1],
      });
    });
  }

  it("waits for an uncommitted seat hold before deciding whether a new alert matches", async () => {
    let allowInventoryCommit!: () => void;
    let signalInventoryLocked!: () => void;
    let signalAlertLockRequested!: () => void;
    const inventoryCommitAllowed = new Promise<void>((resolve) => {
      allowInventoryCommit = resolve;
    });
    const inventoryLocked = new Promise<void>((resolve) => {
      signalInventoryLocked = resolve;
    });
    const alertLockRequested = new Promise<void>((resolve) => {
      signalAlertLockRequested = resolve;
    });

    const inventoryWriter = prisma.$transaction(async (tx) => {
      await lockAvailabilityInventory(tx);
      const booking = await tx.booking.create({
        data: {
          userId: studentId,
          hostelId,
          roomId,
          checkIn,
          checkOut,
          months: 1,
          total: 10_000,
          paymentMethod: "test",
        },
      });
      await createSeatHolds(tx, {
        bookingId: booking.id,
        roomId,
        checkIn,
        checkOut,
        seatNumbers: [1],
      });
      signalInventoryLocked();
      await inventoryCommitAllowed;
    });
    await inventoryLocked;

    let lockRequestObserved = false;
    const observingDatabase = {
      $transaction: (
        operation: (tx: Prisma.TransactionClient) => Promise<unknown>,
        options?: unknown,
      ) => prisma.$transaction(async (tx) => {
        const observedTx = new Proxy(tx, {
          get(target, property) {
            const value = Reflect.get(target, property);
            if (property === "$queryRaw") {
              return (...args: unknown[]) => {
                if (!lockRequestObserved) {
                  lockRequestObserved = true;
                  signalAlertLockRequested();
                }
                return (value as (...queryArgs: unknown[]) => unknown).apply(target, args);
              };
            }
            return value;
          },
        });
        return operation(observedTx);
      }, options as never),
    };

    const createAlert = createAvailabilityAlert(
      studentId,
      {
        type: "HOSTEL",
        hostelId,
        checkIn: "2099-04-10",
        checkOut: "2099-04-12",
        guests: 1,
      },
      observingDatabase as never,
      new Date("2099-04-01T00:00:00.000Z"),
    );
    await alertLockRequested;
    allowInventoryCommit();
    await inventoryWriter;

    const alert = await createAlert;
    expect(alert?.matched).toBe(false);
    await expect(
      prisma.notification.count({
        where: { userId: studentId, type: "AVAILABILITY_ALERT" },
      }),
    ).resolves.toBe(0);
  });

  it("serializes concurrent retries into one matched transition and one notification", async () => {
    await createHeldSeat();
    const alert = await createAvailabilityAlert(
      studentId,
      {
        type: "HOSTEL",
        hostelId,
        checkIn: "2099-04-10",
        checkOut: "2099-04-12",
        guests: 1,
      },
      prisma,
      new Date("2099-04-01T00:00:00.000Z"),
    );
    expect(alert?.matched).toBe(false);

    await prisma.$transaction(async (tx) => {
      await lockAvailabilityInventory(tx);
      await tx.seatHold.deleteMany({ where: { booking: { hostelId } } });
    });

    await Promise.all(
      Array.from({ length: 4 }, () =>
        prisma.$transaction((tx) =>
          evaluateAvailabilityAlert(alert!.id, tx),
        ),
      ),
    );
    await prisma.$transaction((tx) =>
      evaluateAvailabilityAlert(alert!.id, tx),
    );

    const stored = await prisma.availabilityAlert.findUniqueOrThrow({
      where: { id: alert!.id },
    });
    const notifications = await prisma.notification.findMany({
      where: { availabilityAlertId: alert!.id },
      select: { availabilityAlertTransition: true },
    });
    expect(stored).toMatchObject({ matched: true, matchVersion: 1 });
    expect(notifications).toEqual([{ availabilityAlertTransition: 1 }]);
  });
});
