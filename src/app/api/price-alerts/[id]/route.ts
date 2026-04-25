import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

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

    const { id } = await params;

    // Verify ownership
    const alert = await db.priceAlert.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    if (alert.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const updated = await db.priceAlert.update({
      where: { id },
      data: parsed.data,
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

    return NextResponse.json({ data: updated, message: "Price alert updated." });
  } catch (err) {
    console.error("[PATCH /api/price-alerts/:id]", err);
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

    const { id } = await params;

    // Verify ownership
    const alert = await db.priceAlert.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    if (alert.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.priceAlert.delete({ where: { id } });

    return NextResponse.json({ message: "Price alert deleted." });
  } catch (err) {
    console.error("[DELETE /api/price-alerts/:id]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
