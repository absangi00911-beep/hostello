// Path: src/app/api/price-alerts/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";

const priceAlertSchema = z.object({
  hostelId: z.string().min(1),
  targetPrice: z.number().int().positive(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const alerts = await db.priceAlert.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        hostel: {
          select: { id: true, name: true, slug: true, coverImage: true, pricePerMonth: true, city: true },
        },
      },
    });

    return NextResponse.json({ data: alerts });
  } catch (err) {
    console.error("[GET /api/price-alerts]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const parsed = priceAlertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const hostel = await db.hostel.findUnique({
      where: { id: parsed.data.hostelId },
      select: { id: true, pricePerMonth: true },
    });

    if (!hostel) return NextResponse.json({ error: "Hostel not found." }, { status: 404 });

    const existing = await db.priceAlert.findUnique({
      where: {
        userId_hostelId: {
          userId: session.user.id,
          hostelId: hostel.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Price alert already exists." }, { status: 409 });
    }

    const alert = await db.priceAlert.create({
      data: {
        userId: session.user.id,
        hostelId: hostel.id,
        targetPrice: parsed.data.targetPrice,
        lastKnownPrice: hostel.pricePerMonth,
        active: true,
      },
    });

    return NextResponse.json(
      { data: alert, message: "Price alert created." },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/price-alerts]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
