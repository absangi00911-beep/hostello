import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { parsePagination } from "@/lib/pagination";
import { enforceAdminReadLimit } from "@/lib/admin-read-limit";
import { getSafeErrorSummary } from "@/lib/safe-error";

const OPEN_STATUSES = ["RETRYABLE", "RECONCILIATION_REQUIRED"] as const;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const readLimitResponse = await enforceAdminReadLimit(session.user.id);
  if (readLimitResponse) return readLimitResponse;
  if (req.nextUrl.search.length > 1_024) {
    return NextResponse.json({ error: "Query is too long." }, { status: 400 });
  }

  const { page, limit, skip } = parsePagination(req.nextUrl.searchParams, {
    defaultLimit: 25,
    maxLimit: 50,
  });
  const where = { status: { in: [...OPEN_STATUSES] } };

  try {
    const [events, total] = await Promise.all([
      db.safepayWebhookEvent.findMany({
        where,
        orderBy: [{ receivedAt: "desc" }, { id: "desc" }],
        skip,
        take: limit,
        select: {
          id: true,
          eventType: true,
          merchantOrderId: true,
          tracker: true,
          providerState: true,
          amountMinorUnits: true,
          currency: true,
          status: true,
          processingAttempts: true,
          lastErrorCode: true,
          receivedAt: true,
          updatedAt: true,
          replayEvents: {
            orderBy: { createdAt: "desc" },
            take: 3,
            select: {
              adminUserId: true,
              providerTracker: true,
              reason: true,
              createdAt: true,
            },
          },
        },
      }),
      db.safepayWebhookEvent.count({ where }),
    ]);

    return NextResponse.json(
      { data: events, total, page, limit },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[GET /api/admin/payment-events]", getSafeErrorSummary(error));
    return NextResponse.json({ error: "Could not load payment events." }, { status: 500 });
  }
}
