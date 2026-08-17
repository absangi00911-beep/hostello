// Path: src/app/api/owner/earnings/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getPendingBalance } from "@/lib/payouts";
import { z } from "zod";

const bankDetailsSchema = z.object({
  bankAccountTitle: z.string().trim().min(1).max(120),
  bankAccountNumber: z.string().trim().min(1).max(60),
  bankName: z.string().trim().min(1).max(120),
});

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ownerId = session.user.id;

  try {
    const [pendingBalance, user, payouts] = await Promise.all([
      getPendingBalance(ownerId),
      db.user.findUnique({
        where: { id: ownerId },
        select: { bankAccountTitle: true, bankAccountNumber: true, bankName: true },
      }),
      db.payout.findMany({
        where: { ownerId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          status: true,
          reference: true,
          createdAt: true,
          paidAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      pendingBalance,
      hasBankDetails: Boolean(user?.bankAccountNumber && user?.bankName),
      bankDetails: user?.bankAccountNumber
        ? {
            bankAccountTitle: user.bankAccountTitle,
            bankAccountNumber: user.bankAccountNumber,
            bankName: user.bankName,
          }
        : null,
      payouts,
    });
  } catch (err) {
    console.error("[GET /api/owner/earnings]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

/** Owner sets/updates their own bank details for payout. */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = bankDetailsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in all bank detail fields." }, { status: 400 });
  }

  try {
    const user = await db.user.update({
      where: { id: session.user.id },
      data: parsed.data,
      select: { bankAccountTitle: true, bankAccountNumber: true, bankName: true },
    });

    return NextResponse.json({ bankDetails: user });
  } catch (err) {
    console.error("[PATCH /api/owner/earnings]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
