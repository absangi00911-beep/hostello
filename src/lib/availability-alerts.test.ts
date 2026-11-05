import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));

import {
  createAvailabilityAlert,
  deleteAvailabilityAlert,
  evaluateAvailabilityAlert,
  updateAvailabilityAlert,
  type AvailabilityAlertRecord,
} from "@/lib/availability-alerts";

const checkIn = new Date("2030-03-20T00:00:00.000Z");
const checkOut = new Date("2030-03-22T00:00:00.000Z");
const today = new Date("2030-03-10T00:00:00.000Z");
const checkInInput = "2030-03-20";
const checkOutInput = "2030-03-22";

function createHarness(initialAlert?: Partial<AvailabilityAlertRecord>) {
  let alert: AvailabilityAlertRecord | null = initialAlert
    ? {
        id: "alert-1",
        userId: "student-1",
        type: "HOSTEL",
        hostelId: "hostel-1",
        searchCriteria: null,
        checkIn,
        checkOut,
        guests: 2,
        active: true,
        matched: false,
        matchVersion: 0,
        createdAt: today,
        updatedAt: today,
        ...initialAlert,
      }
    : null;
  let fits = true;
  const notifications: Array<Record<string, unknown>> = [];
  const inventoryQueries = {
    rooms: [] as unknown[],
    holds: [] as unknown[],
    blockedDates: [] as unknown[],
  };
  const tx = {
    $queryRaw: vi.fn(async (query: { values: unknown[] }) =>
      query.values.includes("student-2") ? [] : [{ id: "alert-1" }],
    ),
    availabilityAlert: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        alert = {
          id: "alert-1",
          userId: String(data.userId),
          type: data.type as "HOSTEL" | "SEARCH",
          hostelId: (data.hostelId as string | null) ?? null,
          searchCriteria: data.searchCriteria ?? null,
          checkIn: data.checkIn as Date,
          checkOut: data.checkOut as Date,
          guests: data.guests as number,
          active: true,
          matched: false,
          matchVersion: 0,
          createdAt: today,
          updatedAt: today,
        };
        return alert;
      }),
      findFirst: vi.fn(async () => alert),
      findUnique: vi.fn(async () => alert),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        if (!alert) throw new Error("alert missing");
        alert = { ...alert, ...data, updatedAt: today } as AvailabilityAlertRecord;
        return alert;
      }),
      updateMany: vi.fn(async () => ({ count: alert ? 1 : 0 })),
      deleteMany: vi.fn(async ({ where }: { where: { userId: string } }) => {
        const existed = alert?.userId === where.userId;
        if (existed) alert = null;
        return { count: existed ? 1 : 0 };
      }),
    },
    hostel: {
      findFirst: vi.fn(async () => ({ id: "hostel-1", status: "ACTIVE" })),
      findMany: vi.fn(async () => [
        { id: "hostel-1", latitude: 31.52, longitude: 74.36 },
      ]),
    },
    room: {
      findMany: vi.fn(async (args: unknown) => {
        inventoryQueries.rooms.push(args);
        return [{ id: "room-1", capacity: 4 }];
      }),
    },
    seatHold: {
      findMany: vi.fn(async (args: unknown) => {
        inventoryQueries.holds.push(args);
        return fits ? [] : [
          { roomId: "room-1", seatNo: 1 },
          { roomId: "room-1", seatNo: 2 },
          { roomId: "room-1", seatNo: 3 },
        ];
      }),
    },
    blockedDate: {
      findFirst: vi.fn(async (args: unknown) => {
        inventoryQueries.blockedDates.push(args);
        return null;
      }),
    },
    notification: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        notifications.push(data);
        return { id: `notification-${notifications.length}`, ...data };
      }),
    },
  };
  const database = {
    $transaction: vi.fn(async (operation: (client: typeof tx) => Promise<unknown>) =>
      operation(tx),
    ),
  };

  return {
    database,
    tx,
    notifications,
    inventoryQueries,
    get alert() {
      return alert;
    },
    set fits(value: boolean) {
      fits = value;
    },
  };
}

describe("availability alert service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("evaluates a new alert immediately and writes one notification in the transaction", async () => {
    const harness = createHarness();

    await createAvailabilityAlert(
      "student-1",
      {
        type: "HOSTEL",
        hostelId: "hostel-1",
        checkIn: checkInInput,
        checkOut: checkOutInput,
        guests: 2,
      },
      harness.database as never,
      today,
    );

    expect(harness.database.$transaction).toHaveBeenCalledOnce();
    expect(harness.tx.notification.create).toHaveBeenCalledOnce();
    expect(harness.tx.availabilityAlert.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ matched: true, matchVersion: 1 }),
      }),
    );
    expect(harness.notifications[0]).toMatchObject({
      userId: "student-1",
      type: "AVAILABILITY_ALERT",
      availabilityAlertId: "alert-1",
      availabilityAlertTransition: 1,
    });
  });

  it("evaluates saved searches against public candidates and exact stay availability", async () => {
      const harness = createHarness();

      await createAvailabilityAlert(
        "student-1",
        {
          type: "SEARCH",
          criteria: {
            city: "Lahore",
            gender: "FEMALE",
            minPrice: 10_000,
            amenities: ["wifi"],
          },
          checkIn: checkInInput,
          checkOut: checkOutInput,
          guests: 2,
        },
        harness.database as never,
        today,
      );

      expect(harness.tx.hostel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "ACTIVE",
            city: "Lahore",
            gender: "FEMALE",
            pricePerMonth: { gte: 10_000 },
            amenities: { hasEvery: ["wifi"] },
          }),
          select: { id: true, latitude: true, longitude: true },
        }),
      );
      expect(harness.inventoryQueries.holds[0]).toMatchObject({
        where: {
          roomId: { in: ["room-1"] },
          checkIn: { lt: checkOut },
          checkOut: { gt: checkIn },
        },
      });
      expect(harness.inventoryQueries.blockedDates[0]).toMatchObject({
        where: {
          hostelId: "hostel-1",
          startDate: { lt: checkOut },
          endDate: { gte: checkIn },
        },
      });
      expect(harness.alert?.matched).toBe(true);
      expect(harness.notifications).toHaveLength(1);
    });

  it("does not match a saved search when exact stay inventory cannot fit the guests", async () => {
      const harness = createHarness();
      harness.fits = false;

      await createAvailabilityAlert(
        "student-1",
        {
          type: "SEARCH",
          criteria: { city: "Lahore" },
          checkIn: checkInInput,
          checkOut: checkOutInput,
          guests: 2,
        },
        harness.database as never,
        today,
      );

      expect(harness.tx.hostel.findMany).toHaveBeenCalledOnce();
      expect(harness.alert?.matched).toBe(false);
      expect(harness.notifications).toHaveLength(0);
  });

  it("emits only on unmatched-to-matched transitions and resets when unavailable", async () => {
    const harness = createHarness({ matched: true, matchVersion: 1 });
    harness.fits = true;
    await evaluateAvailabilityAlert("alert-1", harness.tx as never, today);
    expect(harness.notifications).toHaveLength(0);

    harness.fits = false;
    await evaluateAvailabilityAlert("alert-1", harness.tx as never, today);
    expect(harness.alert?.matched).toBe(false);
    expect(harness.notifications).toHaveLength(0);

    harness.fits = true;
    await evaluateAvailabilityAlert("alert-1", harness.tx as never, today);
    expect(harness.alert?.matched).toBe(true);
    expect(harness.notifications).toHaveLength(1);
    expect(harness.notifications[0]).toMatchObject({
      availabilityAlertTransition: 3,
    });
  });

  it("expires an alert when its check-in day begins", async () => {
    const harness = createHarness({ checkIn: today, matched: true });

    await evaluateAvailabilityAlert("alert-1", harness.tx as never, today);

    expect(harness.alert?.active).toBe(false);
    expect(harness.alert?.matched).toBe(false);
    expect(harness.tx.notification.create).not.toHaveBeenCalled();
  });

  it("pauses and resumes alerts, evaluating availability when resumed", async () => {
    const harness = createHarness({ matched: true, matchVersion: 1 });
    await updateAvailabilityAlert(
      "student-1",
      "alert-1",
      { active: false },
      harness.database as never,
      today,
    );
    expect(harness.alert?.active).toBe(false);
    expect(harness.alert?.matched).toBe(false);

    await updateAvailabilityAlert(
      "student-1",
      "alert-1",
      { active: true },
      harness.database as never,
      today,
    );
    expect(harness.alert?.active).toBe(true);
    expect(harness.alert?.matched).toBe(true);
    expect(harness.notifications).toHaveLength(1);
  });

  it("resets match state and evaluates edited criteria immediately", async () => {
    const harness = createHarness({ matched: true, matchVersion: 1 });

    await updateAvailabilityAlert(
      "student-1",
      "alert-1",
      {
        criteria: {
          type: "HOSTEL",
          hostelId: "hostel-1",
          checkIn: "2030-03-21",
          checkOut: checkOutInput,
          guests: 2,
        },
      },
      harness.database as never,
      today,
    );

    expect(harness.alert?.checkIn).toEqual(new Date("2030-03-21T00:00:00.000Z"));
    expect(harness.alert?.matched).toBe(true);
    expect(harness.notifications).toHaveLength(1);
  });

  it("deletes an alert only in the authenticated user's scope", async () => {
    const harness = createHarness({});

    await expect(
      deleteAvailabilityAlert("student-2", "alert-1", harness.database as never),
    ).resolves.toBe(false);
    expect(harness.alert).not.toBeNull();

    await expect(
      deleteAvailabilityAlert("student-1", "alert-1", harness.database as never),
    ).resolves.toBe(true);
    expect(harness.alert).toBeNull();
  });
});
