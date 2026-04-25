import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  hostelId: z.string().cuid("Invalid hostel ID"),
  targetPrice: z.number().positive("Target price must be positive"),
});

const updateSchema = z.object({
  targetPrice: z.number().positive("Target price must be positive"),
  active: z.boolean().optional(),
});

// GET /api/price-alerts — List user's price alerts
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alerts = await db.priceAlert.findMany({
      where: { userId: session.user.id },
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: alerts });
  } catch (err) {
    console.error("[GET /api/price-alerts]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// POST /api/price-alerts — Create a new price alert
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }

    const { hostelId, targetPrice } = parsed.data;

    // Verify hostel exists
    const hostel = await db.hostel.findUnique({
      where: { id: hostelId },
      select: { id: true, pricePerMonth: true },
    });

    if (!hostel) {
      return NextResponse.json({ error: "Hostel not found" }, { status: 404 });
    }

    // Check if alert already exists for this hostel
    const existing = await db.priceAlert.findUnique({
      where: { userId_hostelId: { userId: session.user.id, hostelId } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Alert already exists for this hostel" },
        { status: 400 }
      );
    }

    // Create alert
    const alert = await db.priceAlert.create({
      data: {
        userId: session.user.id,
        hostelId,
        targetPrice,
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

    return NextResponse.json({ data: alert, message: "Price alert created." }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/price-alerts]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
