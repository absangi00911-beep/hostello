import { getPakistanCalendarDate } from "@hostello/shared";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { readBoundedJson } from "@/lib/bounded-json";
import { parsePagination } from "@/lib/pagination";
import { rateLimit } from "@/lib/rate-limit";
import { getSafeErrorSummary } from "@/lib/safe-error";
import {
  AvailabilityAlertHostelUnavailableError,
  AvailabilityAlertValidationError,
  createAvailabilityAlert,
  expireAvailabilityAlerts,
  serializeAvailabilityAlert,
  type AvailabilityAlertInput,
} from "@/lib/availability-alerts";

const stayFields = {
  checkIn: z.string().max(10).regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().max(10).regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(4),
};
const hostelAlertSchema = z.object({
  type: z.literal("HOSTEL"),
  hostelId: z.string().min(1).max(128),
  ...stayFields,
}).strict();
const searchAlertSchema = z.object({
  type: z.literal("SEARCH"),
  criteria: z.record(z.string(), z.unknown()),
  ...stayFields,
}).strict();
const createSchema = z.discriminatedUnion("type", [
  hostelAlertSchema,
  searchAlertSchema,
]);

function studentId(
  session: { user: { id: string; role?: string } } | null,
) {
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (session.user.role !== "STUDENT") {
    return { error: NextResponse.json({ error: "Student access required." }, { status: 403 }) };
  }
  return { userId: session.user.id };
}

function rateLimitResponse(resetAt: number) {
  return NextResponse.json(
    { error: "Too many availability alert requests. Please try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))) },
    },
  );
}

export async function GET(req: NextRequest) {
  try {
    const access = studentId(await auth());
    if ("error" in access) return access.error;
    if (req.nextUrl.search.length > 1_024) {
      return NextResponse.json({ error: "Query is too long." }, { status: 400 });
    }

    const quota = await rateLimit(`availability-alerts:list:${access.userId}`, {
      limit: 60,
      windowMs: 60_000,
    });
    if (!quota.ok) return rateLimitResponse(quota.resetAt);

    const { page, limit, skip } = parsePagination(req.nextUrl.searchParams, {
      defaultLimit: 20,
      maxLimit: 50,
    });
    const where = { userId: access.userId };
    const today = getPakistanCalendarDate();
    await expireAvailabilityAlerts(today, db, access.userId);
    const [alerts, total] = await Promise.all([
      db.availabilityAlert.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { hostel: { select: { name: true } } },
      }),
      db.availabilityAlert.count({ where }),
    ]);

    return NextResponse.json({
      data: alerts.map((alert) =>
        serializeAvailabilityAlert(alert, today, alert.hostel?.name),
      ),
      total,
      page,
      limit,
      hasMore: skip + alerts.length < total,
    });
  } catch (error) {
    console.error("[GET /api/availability-alerts]", getSafeErrorSummary(error));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const access = studentId(await auth());
    if ("error" in access) return access.error;

    const quota = await rateLimit(`availability-alerts:create:${access.userId}`, {
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    if (!quota.ok) return rateLimitResponse(quota.resetAt);

    const body = await readBoundedJson(req, 4_096);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    const parsed = createSchema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const today = getPakistanCalendarDate();
    const alert = await createAvailabilityAlert(
      access.userId,
      parsed.data as AvailabilityAlertInput,
      db,
      today,
    );
    if (!alert) {
      return NextResponse.json({ error: "Could not create alert." }, { status: 500 });
    }
    return NextResponse.json(
      { data: serializeAvailabilityAlert(alert, today), message: "Availability alert created." },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AvailabilityAlertHostelUnavailableError) {
      return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
    }
    if (error instanceof AvailabilityAlertValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[POST /api/availability-alerts]", getSafeErrorSummary(error));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
