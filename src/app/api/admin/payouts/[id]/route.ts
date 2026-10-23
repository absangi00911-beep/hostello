import { getSafeErrorSummary } from "@/lib/safe-error";
// Path: src/app/api/admin/payouts/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { cancelPayoutBatch, markPayoutPaid, PayoutServiceError } from "@/lib/payouts";
import { z } from "zod";
import { readBoundedJson } from "@/lib/bounded-json";
import { rateLimit } from "@/lib/rate-limit";
import { isBoundedRouteParam } from "@/lib/route-params";

const updatePayoutSchema = z.object({
  action: z.enum(["mark-paid", "void"]).optional(),
  reference: z.string().trim().min(1).max(200).optional(),
  reason: z.string().trim().min(10).max(500).optional(),
  confirmTransferNotSent: z.literal(true).optional(),
}).superRefine((data, context) => {
  if (data.action === "void") {
    if (!data.reason) {
      context.addIssue({ code: "custom", path: ["reason"], message: "A reason is required." });
    }
    if (data.confirmTransferNotSent !== true) {
      context.addIssue({ code: "custom", path: ["confirmTransferNotSent"], message: "Confirmation is required." });
    }
  } else if (!data.reference) {
    context.addIssue({ code: "custom", path: ["reference"], message: "A transfer reference is required." });
  }
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const { id } = await params;
  if (!isBoundedRouteParam(id)) {
    return NextResponse.json({ error: "Invalid payout." }, { status: 400 });
  }
  const body = await readBoundedJson(req, 1_024);
  if (!body.ok) {
    return NextResponse.json({ error: body.error }, { status: body.status });
  }
  const parsed = updatePayoutSchema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const payout = parsed.data.action === "void"
      ? await cancelPayoutBatch(
          id,
          session.user.id,
          parsed.data.reason!,
          parsed.data.confirmTransferNotSent === true,
        )
      : await markPayoutPaid(id, session.user.id, parsed.data.reference!);
    return NextResponse.json({ data: payout });
  } catch (err) {
    console.error("[PATCH /api/admin/payouts/[id]]", getSafeErrorSummary(err));
    if (err instanceof PayoutServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: "Could not update payout. Please try again." }, { status: 500 });
  }
}
