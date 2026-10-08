import { getSafeErrorSummary } from "@/lib/safe-error";
// Path: src/app/api/price-alerts/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";
import { readBoundedJson } from "@/lib/bounded-json";
import { rateLimit } from "@/lib/rate-limit";

const updateSchema = z.object({
  targetPrice: z.number().positive("Target price must be positive").optional(),
  active: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/price-alerts/:id — Update price alert
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actionLimit = await rateLimit(`price-alert-action:${session.user.id}`, {
      limit: 60,
      windowMs: 60 * 1000,
    });
    if (!actionLimit.ok) {
      return NextResponse.json(
        { error: "Too many price alert actions. Please slow down." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(1, Math.ceil((actionLimit.resetAt - Date.now()) / 1000))) },
        },
      );
    }

    const { id } = await params;
    if (id.length > 64) {
      return NextResponse.json({ error: "Invalid alert ID." }, { status: 400 });
    }

    // Verify ownership
    const alert = await db.priceAlert.findFirst({
      where: {
        id,
        userId: session.user.id,
        hostel: { is: { status: "ACTIVE" } },
      },
      select: { hostel: { select: { status: true } } },
    });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    if (alert.hostel.status !== "ACTIVE") {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    const body = await readBoundedJson(req, 1_024);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    const parsed = updateSchema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const updateResult = await db.priceAlert.updateMany({
      where: {
        id,
        userId: session.user.id,
        hostel: { is: { status: "ACTIVE" } },
      },
      data: parsed.data,
    });
    if (updateResult.count !== 1) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    const updated = await db.priceAlert.findFirst({
      where: {
        id,
        userId: session.user.id,
        hostel: { is: { status: "ACTIVE" } },
      },
      include: {
        hostel: {
          select: {
            id: true,
            name: true,
            slug: true,
            pricePerMonth: true,
            city: true,
            coverImage: true,
          },
        },
      },
    });
    if (!updated) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated, message: "Price alert updated." });
  } catch (err) {
    console.error("[PATCH /api/price-alerts/:id]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// DELETE /api/price-alerts/:id — Delete price alert
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actionLimit = await rateLimit(`price-alert-action:${session.user.id}`, {
      limit: 60,
      windowMs: 60 * 1000,
    });
    if (!actionLimit.ok) {
      return NextResponse.json(
        { error: "Too many price alert actions. Please slow down." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(1, Math.ceil((actionLimit.resetAt - Date.now()) / 1000))) },
        },
      );
    }

    const { id } = await params;
    if (id.length > 64) {
      return NextResponse.json({ error: "Invalid alert ID." }, { status: 400 });
    }

    // Verify ownership
    const alert = await db.priceAlert.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }


    const deleted = await db.priceAlert.deleteMany({
      where: { id, userId: session.user.id },
    });
    if (deleted.count !== 1) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Price alert deleted." });
  } catch (err) {
    console.error("[DELETE /api/price-alerts/:id]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
