import { getPakistanCalendarDate } from "@hostello/shared";
import { Prisma, type PrismaClient } from "@/generated/client";
import type { AvailabilityAlert, AvailabilityAlertType } from "@/generated/client";
import { db } from "@/lib/db";
import {
  normalizeAvailabilityAlertStay,
  normalizeSearchAlertCriteria,
  type SearchAlertCriteria,
} from "@/lib/availability-alert-criteria";
import { distanceBetweenCoordinatesKm, NEARBY_SEARCH_RADIUS_KM } from "@/lib/nearby-search";
import { getHostelStayAvailability } from "@/lib/room-availability-service";
import { buildPublicSearchWhereClause } from "@/lib/hostel-search";

export type AvailabilityAlertRecord = AvailabilityAlert;

export type AvailabilityAlertInput =
  | {
      type: "HOSTEL";
      hostelId: string;
      checkIn: string;
      checkOut: string;
      guests: number;
    }
  | {
      type: "SEARCH";
      criteria: unknown;
      checkIn: string;
      checkOut: string;
      guests: number;
    };

export type AvailabilityAlertUpdateInput = {
  active?: boolean;
  criteria?: AvailabilityAlertInput;
};

type AlertDatabase = Pick<PrismaClient, "$transaction" | "availabilityAlert">;
type AlertTransaction = Prisma.TransactionClient;

type PublicHostelFilters = {
  id: string;
  status: string;
  name: string;
  description: string;
  city: string;
  area: string | null;
  address: string;
  gender: string;
  pricePerMonth: number;
  amenities: string[];
  verified: boolean;
  latitude: number | null;
  longitude: number | null;
};

export class AvailabilityAlertNotFoundError extends Error {
  constructor() {
    super("Availability alert not found.");
    this.name = "AvailabilityAlertNotFoundError";
  }
}

export class AvailabilityAlertHostelUnavailableError extends Error {
  constructor() {
    super("Hostel not found.");
    this.name = "AvailabilityAlertHostelUnavailableError";
  }
}

export class AvailabilityAlertValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AvailabilityAlertValidationError";
  }
}

function isDateOnly(value: Date) {
  return Number.isFinite(value.getTime()) &&
    value.getUTCHours() === 0 &&
    value.getUTCMinutes() === 0 &&
    value.getUTCSeconds() === 0 &&
    value.getUTCMilliseconds() === 0;
}

function dateOnlyString(value: Date) {
  if (!isDateOnly(value)) throw new Error("Alert dates must be calendar dates.");
  return value.toISOString().slice(0, 10);
}

function normalizeInput(input: AvailabilityAlertInput, today: Date) {
  try {
    const stay = normalizeAvailabilityAlertStay(
      {
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        guests: input.guests,
      },
      today,
    );
    if (input.type === "HOSTEL") {
      if (typeof input.hostelId !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(input.hostelId)) {
        throw new Error("Hostel is invalid.");
      }
      return {
        type: "HOSTEL" as const,
        hostelId: input.hostelId,
        searchCriteria: Prisma.DbNull,
        ...stay,
      };
    }

    const searchCriteria = normalizeSearchAlertCriteria(input.criteria);
    return {
      type: "SEARCH" as const,
      hostelId: null,
      searchCriteria: searchCriteria as Prisma.InputJsonValue,
      ...stay,
    };
  } catch (error) {
    throw new AvailabilityAlertValidationError(
      error instanceof Error ? error.message : "Invalid availability alert.",
    );
  }
}

function criteriaFor(alert: AvailabilityAlert): SearchAlertCriteria {
  return normalizeSearchAlertCriteria(alert.searchCriteria);
}

function matchesPublicFilters(
  hostel: PublicHostelFilters,
  criteria: SearchAlertCriteria,
) {
  if (hostel.status !== "ACTIVE") return false;
  if (criteria.q) {
    const query = criteria.q.toLocaleLowerCase();
    const searchable = [
      hostel.name,
      hostel.description,
      hostel.city,
      hostel.area ?? "",
      hostel.address,
    ];
    if (!searchable.some((value) => value.toLocaleLowerCase().includes(query))) {
      return false;
    }
  }
  if (criteria.city && hostel.city !== criteria.city) return false;
  if (criteria.gender && hostel.gender !== criteria.gender) return false;
  if (criteria.verified && !hostel.verified) return false;
  if (criteria.minPrice !== undefined && hostel.pricePerMonth < criteria.minPrice) return false;
  if (criteria.maxPrice !== undefined && hostel.pricePerMonth > criteria.maxPrice) return false;
  if (criteria.amenities?.some((amenity) => !hostel.amenities.includes(amenity))) {
    return false;
  }
  if (criteria.nearby) {
    if (hostel.latitude === null || hostel.longitude === null) return false;
    return distanceBetweenCoordinatesKm(criteria.nearby, {
      latitude: hostel.latitude,
      longitude: hostel.longitude,
    }) <= NEARBY_SEARCH_RADIUS_KM;
  }
  return true;
}

async function alertMatches(
  tx: AlertTransaction,
  alert: AvailabilityAlert,
): Promise<boolean> {
  if (alert.type === "HOSTEL") {
    if (!alert.hostelId) return false;
    const hostel = await tx.hostel.findFirst({
      where: { id: alert.hostelId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!hostel) return false;
    const rooms = await getHostelStayAvailability(tx, {
      hostelId: alert.hostelId,
      checkIn: alert.checkIn,
      checkOut: alert.checkOut,
      guests: alert.guests,
    });
    return rooms.some((room) => room.fits);
  }

  const criteria = criteriaFor(alert);
  const candidates = await tx.hostel.findMany({
    where: buildPublicSearchWhereClause(criteria),
    orderBy: { id: "asc" },
    select: { id: true, latitude: true, longitude: true },
  });
  for (const candidate of candidates) {
    if (
      criteria.nearby &&
      (candidate.latitude === null ||
        candidate.longitude === null ||
        distanceBetweenCoordinatesKm(criteria.nearby, {
          latitude: candidate.latitude,
          longitude: candidate.longitude,
        }) > NEARBY_SEARCH_RADIUS_KM)
    ) {
      continue;
    }

    const rooms = await getHostelStayAvailability(tx, {
      hostelId: candidate.id,
      checkIn: alert.checkIn,
      checkOut: alert.checkOut,
      guests: alert.guests,
    });
    if (rooms.some((room) => room.fits)) return true;
  }
  return false;
}

async function lockAlert(
  tx: AlertTransaction,
  id: string,
  userId?: string,
) {
  const ownershipFilter = userId
    ? Prisma.sql`AND "userId" = ${userId}`
    : Prisma.empty;
  const rows = await tx.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`SELECT "id" FROM "availability_alerts" WHERE "id" = ${id} ${ownershipFilter} FOR UPDATE`,
  );
  return rows.length > 0;
}

export async function evaluateAvailabilityAlert(
  id: string,
  tx: AlertTransaction,
  today = getPakistanCalendarDate(),
) {
  if (!await lockAlert(tx, id)) return null;
  const alert = await tx.availabilityAlert.findUnique({ where: { id } });
  if (!alert) return null;

  if (alert.active && alert.checkIn <= today) {
    return tx.availabilityAlert.update({
      where: { id },
      data: { active: false, matched: false },
    });
  }
  if (!alert.active) return alert;

  const matched = await alertMatches(tx, alert);
  if (matched === alert.matched) return alert;

  const matchVersion = alert.matchVersion + 1;
  const updated = await tx.availabilityAlert.update({
    where: { id },
    data: { matched, matchVersion },
  });
  if (!alert.matched && matched) {
    await tx.notification.create({
      data: {
        userId: alert.userId,
        type: "AVAILABILITY_ALERT",
        title: "Availability alert matched",
        message: "A stay matching your dates and guest count is available. View your alerts to review it.",
        availabilityAlertId: alert.id,
        availabilityAlertTransition: matchVersion,
      },
    });
  }
  return updated;
}

export async function createAvailabilityAlert(
  userId: string,
  input: AvailabilityAlertInput,
  database: AlertDatabase = db,
  today = getPakistanCalendarDate(),
) {
  const normalized = normalizeInput(input, today);
  return database.$transaction(async (tx) => {
    if (normalized.type === "HOSTEL") {
      const hostel = await tx.hostel.findFirst({
        where: { id: normalized.hostelId, status: "ACTIVE" },
        select: { id: true },
      });
      if (!hostel) throw new AvailabilityAlertHostelUnavailableError();
    }

    const alert = await tx.availabilityAlert.create({
      data: { userId, ...normalized },
    });
    return evaluateAvailabilityAlert(alert.id, tx, today);
  }, { isolationLevel: "ReadCommitted" });
}

export async function updateAvailabilityAlert(
  userId: string,
  id: string,
  input: AvailabilityAlertUpdateInput,
  database: AlertDatabase = db,
  today = getPakistanCalendarDate(),
) {
  return database.$transaction(async (tx) => {
    if (!await lockAlert(tx, id, userId)) return null;
    const current = await tx.availabilityAlert.findFirst({
      where: { id, userId },
    });
    if (!current) return null;

    let data: Prisma.AvailabilityAlertUpdateInput = {};
    if (input.criteria) {
      const normalized = normalizeInput(input.criteria, today);
      data = {
        ...normalized,
        matched: false,
      };
      if (normalized.type === "HOSTEL") {
        const hostel = await tx.hostel.findFirst({
          where: { id: normalized.hostelId, status: "ACTIVE" },
          select: { id: true },
        });
        if (!hostel) throw new AvailabilityAlertHostelUnavailableError();
      }
    }
    if (input.active !== undefined) {
      data.active = input.active;
      if (!input.active) data.matched = false;
    }
    if (Object.keys(data).length > 0) {
      await tx.availabilityAlert.update({ where: { id }, data });
    }
    return evaluateAvailabilityAlert(id, tx, today);
  }, { isolationLevel: "ReadCommitted" });
}

export async function deleteAvailabilityAlert(
  userId: string,
  id: string,
  database: AlertDatabase = db,
) {
  return database.$transaction(async (tx) => {
    if (!await lockAlert(tx, id, userId)) return false;
    const deleted = await tx.availabilityAlert.deleteMany({
      where: { id, userId },
    });
    return deleted.count === 1;
  }, { isolationLevel: "ReadCommitted" });
}

const REEVALUATION_HOSTEL_SELECT = {
  id: true,
  status: true,
  name: true,
  description: true,
  city: true,
  area: true,
  address: true,
  gender: true,
  pricePerMonth: true,
  amenities: true,
  verified: true,
  latitude: true,
  longitude: true,
} as const;

export async function reevaluateAvailabilityAlertsForHostel(
  tx: AlertTransaction,
  hostelId: string,
  options: { includeAllSearchAlerts?: boolean } = {},
) {
  const hostel = await tx.hostel.findUnique({
    where: { id: hostelId },
    select: REEVALUATION_HOSTEL_SELECT,
  });
  const alerts = await tx.availabilityAlert.findMany({
    where: {
      active: true,
      OR: [
        { type: "HOSTEL", hostelId },
        { type: "SEARCH" },
      ],
    },
    select: { id: true, type: true, searchCriteria: true },
    orderBy: { id: "asc" },
  });
  let evaluated = 0;
  for (const alert of alerts) {
    if (
      alert.type === "SEARCH" &&
      !options.includeAllSearchAlerts &&
      hostel &&
      !matchesPublicFilters(hostel, normalizeSearchAlertCriteria(alert.searchCriteria))
    ) {
      continue;
    }
    await evaluateAvailabilityAlert(alert.id, tx);
    evaluated++;
  }
  return evaluated;
}

export async function reevaluateAllAvailabilityAlerts(
  tx: AlertTransaction,
) {
  const alerts = await tx.availabilityAlert.findMany({
    where: { active: true },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  for (const alert of alerts) await evaluateAvailabilityAlert(alert.id, tx);
  return alerts.length;
}

export async function expireAvailabilityAlerts(
  today = getPakistanCalendarDate(),
  database: AlertDatabase = db,
  userId?: string,
) {
  return database.availabilityAlert.updateMany({
    where: {
      active: true,
      checkIn: { lte: today },
      ...(userId ? { userId } : {}),
    },
    data: { active: false, matched: false },
  });
}

export function getAvailabilityAlertStatus(
  alert: Pick<AvailabilityAlert, "active" | "checkIn">,
  today = getPakistanCalendarDate(),
) {
  if (alert.checkIn <= today) return "EXPIRED" as const;
  return alert.active ? "ACTIVE" as const : "PAUSED" as const;
}

export function serializeAvailabilityAlert(
  alert: AvailabilityAlert,
  today = getPakistanCalendarDate(),
  hostelName?: string | null,
) {
  return {
    id: alert.id,
    type: alert.type satisfies AvailabilityAlertType,
    ...(alert.type === "HOSTEL" ? { hostelName: hostelName ?? null } : {}),
    criteria: alert.type === "HOSTEL"
      ? { hostelId: alert.hostelId }
      : criteriaFor(alert),
    checkIn: dateOnlyString(alert.checkIn),
    checkOut: dateOnlyString(alert.checkOut),
    guests: alert.guests,
    status: getAvailabilityAlertStatus(alert, today),
    isMatched: alert.matched,
    createdAt: alert.createdAt,
    updatedAt: alert.updatedAt,
  };
}
