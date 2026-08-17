// Path: src/app/api/admin/payouts/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { createPayoutBatch } from "@/lib/payouts";
import { z } from "zod";

const generateSchema = z.object({
  ownerId: z.string().cuid(),
});

// Owners with either a pending balance or at least one prior payout —
// this is the admin queue, not a generic "all owners" listing.
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const owners = await db.user.findMany({
      where: { role: "OWNER" },
      select: {
        id: true,
        name: true,
        email: true,
        bankAccountTitle: true,
        bankAccountNumber: true,
        bankName: true,
        hostels: {
          select: {
            bookings: {
              where: {
                status: { in: ["CONFIRMED", "COMPLETED"] },
                paymentStatus: "PAID",
                checkOut: { lte: new Date() },
                payoutId: null,
              },
              select: { total: true },
            },
          },
        },
        payouts: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            amount: true,
            status: true,
            reference: true,
            createdAt: true,
            paidAt: true,
          },
        },
      },
    });

    const data = owners
      .map((owner) => {
        const pendingBalance = owner.hostels.reduce(
          (sum, hostel) => sum + hostel.bookings.reduce((s, b) => s + b.total, 0),
          0,
        );
        return {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          hasBankDetails: Boolean(owner.bankAccountNumber && owner.bankName),
          pendingBalance,
          payouts: owner.payouts,
        };
      })
      .filter((owner) => owner.pendingBalance > 0 || owner.payouts.length > 0)
      .sort((a, b) => b.pendingBalance - a.pendingBalance);

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[GET /api/admin/payouts]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// Generates a batch: claims every currently-eligible booking for one owner.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const payout = await createPayoutBatch(parsed.data.ownerId, session.user.id);
    return NextResponse.json({ data: payout }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/payouts]", err);
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
