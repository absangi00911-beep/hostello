import { getSafeErrorSummary } from "@/lib/safe-error";
// Path: src/app/api/admin/payouts/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { createPayoutBatch, getEligiblePayoutBookingWhere, PayoutServiceError } from "@/lib/payouts";
import { parsePagination } from "@/lib/pagination";
import type { Prisma } from "@/generated/client";
import { z } from "zod";
import { readBoundedJson } from "@/lib/bounded-json";
import { rateLimit } from "@/lib/rate-limit";
import { enforceAdminReadLimit } from "@/lib/admin-read-limit";

const generateSchema = z.object({
  ownerId: z.string().cuid(),
});

const PAYOUT_HISTORY_PER_OWNER = 20;

// Owners with either a pending balance or at least one prior payout —
// this is the admin queue, not a generic "all owners" listing.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const readLimitResponse = await enforceAdminReadLimit(session.user.id);
  if (readLimitResponse) return readLimitResponse;

  if (req.nextUrl.search.length > 1_024) {
    return NextResponse.json({ error: "Query is too long." }, { status: 400 });
  }

  const { page, limit, skip } = parsePagination(req.nextUrl.searchParams, {
    defaultLimit: 25,
    maxLimit: 50,
  });
  const eligibleBookingWhere = getEligiblePayoutBookingWhere();
  const ownerWhere: Prisma.UserWhereInput = {
    role: "OWNER",
    OR: [
      { hostels: { some: { bookings: { some: eligibleBookingWhere } } } },
      { payouts: { some: {} } },
    ],
  };

  try {
    const [owners, total] = await Promise.all([
      db.user.findMany({
        where: ownerWhere,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          bankAccountTitle: true,
          bankAccountNumber: true,
          bankName: true,
          hostels: { select: { id: true } },
          payouts: {
            orderBy: { createdAt: "desc" },
            take: PAYOUT_HISTORY_PER_OWNER,
            select: {
              id: true,
              amount: true,
              status: true,
              reference: true,
              createdAt: true,
              paidAt: true,
            },
          },
          _count: { select: { payouts: true } },
        },
      }),
      db.user.count({ where: ownerWhere }),
    ]);

    const ownerIds = owners.map((owner) => owner.id);
    const hostelOwner = new Map(owners.flatMap((owner) =>
      owner.hostels.map((hostel) => [hostel.id, owner.id] as const),
    ));
    const balances = new Map<string, number>(ownerIds.map((ownerId) => [ownerId, 0]));
    const bookingTotals = ownerIds.length === 0
      ? []
      : await db.booking.groupBy({
          by: ["hostelId"],
          where: {
            ...eligibleBookingWhere,
            hostel: { ownerId: { in: ownerIds } },
          },
          _sum: { total: true },
        });

    for (const group of bookingTotals) {
      const ownerId = hostelOwner.get(group.hostelId);
      if (ownerId) balances.set(ownerId, (balances.get(ownerId) ?? 0) + Number(group._sum.total ?? 0));
    }

    const data = owners
      .map((owner) => ({
          id: owner.id,
          name: owner.name,
          email: owner.email,
          hasBankDetails: Boolean(
            owner.bankAccountTitle?.trim() &&
            owner.bankAccountNumber?.trim() &&
            owner.bankName?.trim()
          ),
          pendingBalance: balances.get(owner.id) ?? 0,
          payouts: owner.payouts,
          payoutHistoryTruncated: owner._count.payouts > owner.payouts.length,
        }));

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      hasMore: skip + owners.length < total,
      payoutHistoryPerOwner: PAYOUT_HISTORY_PER_OWNER,
    });
  } catch (err) {
    console.error("[GET /api/admin/payouts]", getSafeErrorSummary(err));
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// Generates a batch: claims every currently-eligible booking for one owner.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payoutLimit = await rateLimit(`admin-payout-write:${session.user.id}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!payoutLimit.ok) {
    return NextResponse.json(
      { error: "Too many payout actions. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, Math.ceil((payoutLimit.resetAt - Date.now()) / 1000))) },
      },
    );
  }

  const body = await readBoundedJson(req, 1_024);
  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: body.status });
  }
  const parsed = generateSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const payout = await createPayoutBatch(parsed.data.ownerId, session.user.id);
    return NextResponse.json({ data: payout }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/payouts]", getSafeErrorSummary(err));
    if (err instanceof PayoutServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: "Could not create payout batch. Please try again." }, { status: 500 });
  }
}
