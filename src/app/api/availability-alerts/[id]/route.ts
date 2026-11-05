import { getPakistanCalendarDate } from "@hostello/shared";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { readBoundedJson } from "@/lib/bounded-json";
import { rateLimit } from "@/lib/rate-limit";
import { getSafeErrorSummary } from "@/lib/safe-error";
import { isBoundedRouteParam } from "@/lib/route-params";
import {
  AvailabilityAlertHostelUnavailableError,
  AvailabilityAlertValidationError,
  deleteAvailabilityAlert,
  serializeAvailabilityAlert,
  updateAvailabilityAlert,
  type AvailabilityAlertInput,
} from "@/lib/availability-alerts";

const stayFields = {
  checkIn: z.string().max(10).regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().max(10).regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(4),
};
const criteriaSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("HOSTEL"),
    hostelId: z.string().min(1).max(128),
    ...stayFields,
  }).strict(),
  z.object({
    type: z.literal("SEARCH"),
    criteria: z.record(z.string(), z.unknown()),
    ...stayFields,
  }).strict(),
]);
const updateSchema = z.object({
  active: z.boolean().optional(),
  criteria: criteriaSchema.optional(),
}).strict().refine((value) => value.active !== undefined || value.criteria !== undefined);

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

async function getActionContext(id: string) {
  const access = studentId(await auth());
  if ("error" in access) return { error: access.error } as const;
  const quota = await rateLimit(`availability-alerts:action:${access.userId}`, {
    limit: 60,
    windowMs: 60_000,
  });
  if (!quota.ok) return { error: rateLimitResponse(quota.resetAt) } as const;
  if (!isBoundedRouteParam(id)) {
    return {
      error: NextResponse.json({ error: "Invalid alert ID." }, { status: 400 }),
    } as const;
  }
  return { userId: access.userId } as const;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const context = await getActionContext(id);
    if ("error" in context) return context.error;

    const body = await readBoundedJson(req, 4_096);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    const parsed = updateSchema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const today = getPakistanCalendarDate();
    const alert = await updateAvailabilityAlert(
      context.userId,
      id,
      {
        active: parsed.data.active,
        criteria: parsed.data.criteria as AvailabilityAlertInput | undefined,
      },
      db,
      today,
    );
    if (!alert) {
      return NextResponse.json({ error: "Availability alert not found." }, { status: 404 });
    }
    return NextResponse.json({
      data: serializeAvailabilityAlert(alert, today),
      message: "Availability alert updated.",
    });
  } catch (error) {
    if (error instanceof AvailabilityAlertHostelUnavailableError) {
      return NextResponse.json({ error: "Hostel not found." }, { status: 404 });
    }
    if (error instanceof AvailabilityAlertValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[PATCH /api/availability-alerts/:id]", getSafeErrorSummary(error));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const context = await getActionContext(id);
    if ("error" in context) return context.error;

    const deleted = await deleteAvailabilityAlert(context.userId, id, db);
    if (!deleted) {
      return NextResponse.json({ error: "Availability alert not found." }, { status: 404 });
    }
    return NextResponse.json({ message: "Availability alert deleted." });
  } catch (error) {
    console.error("[DELETE /api/availability-alerts/:id]", getSafeErrorSummary(error));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
