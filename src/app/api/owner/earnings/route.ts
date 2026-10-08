import { getSafeErrorSummary } from "@/lib/safe-error";
// Path: src/app/api/owner/earnings/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { getPendingBalance } from "@/lib/payouts";
import { z } from "zod";
import { readBoundedJson } from "@/lib/bounded-json";
import { parsePagination } from "@/lib/pagination";
import { rateLimit } from "@/lib/rate-limit";

const OWNER_EARNINGS_READS_PER_MINUTE = 30;

const bankDetailsSchema = z.object({
  bankAccountTitle: z.string().trim().min(1).max(120),
  bankAccountNumber: z.string().trim().min(1).max(60),
  bankName: z.string().trim().min(1).max(120),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const readLimit = await rateLimit(`owner-earnings-read:${session.user.id}`, {
    limit: OWNER_EARNINGS_READS_PER_MINUTE,
    windowMs: 60_000,
  });
  if (!readLimit.ok) {
    return NextResponse.json(
      { error: "Too many earnings requests. Please slow down." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, Math.ceil((readLimit.resetAt - Date.now()) / 1000))) },
      },
    );
  }

  if (req.nextUrl.search.length > 1_024) {
    return NextResponse.json({ error: "Query is too long." }, { status: 400 });
  }
  const { page, limit, skip } = parsePagination(req.nextUrl.searchParams, {
    defaultLimit: 20,
    maxLimit: 50,
  });

  const ownerId = session.user.id;

  try {
    const [pendingBalance, user, payouts, payoutTotal] = await Promise.all([
      getPendingBalance(ownerId),
      db.user.findUnique({
        where: { id: ownerId },
        select: { bankAccountTitle: true, bankAccountNumber: true, bankName: true },
      }),
      db.payout.findMany({
        where: { ownerId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          amount: true,
          status: true,
          reference: true,
          createdAt: true,
          paidAt: true,
        },
      }),
      db.payout.count({ where: { ownerId } }),
    ]);

    return NextResponse.json({
      pendingBalance,
      hasBankDetails: Boolean(
        user?.bankAccountTitle?.trim() &&
        user?.bankAccountNumber?.trim() &&
        user?.bankName?.trim()
      ),
      bankDetails: user?.bankAccountNumber
        ? {
            bankAccountTitle: user.bankAccountTitle,
            bankAccountNumber: user.bankAccountNumber,
            bankName: user.bankName,
          }
        : null,
      payouts,
      payoutTotal,
      payoutPage: page,
      payoutLimit: limit,
      payoutHasMore: skip + payouts.length < payoutTotal,
    });
  } catch (err) {
    console.error("[GET /api/owner/earnings]", getSafeErrorSummary(err));
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

  const detailsLimit = await rateLimit(`owner-bank-details:${session.user.id}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!detailsLimit.ok) {
    return NextResponse.json({ error: "Too many bank-detail changes. Try again later." }, { status: 429 });
  }

  const body = await readBoundedJson(req, 2_048);
  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: body.status });
  }
  const parsed = bankDetailsSchema.safeParse(body.data);
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
    console.error("[PATCH /api/owner/earnings]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
