import { getSafeErrorSummary } from "@/lib/safe-error";
// Path: src/app/api/admin/bookings/[id]/refund/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { confirmManualRefund, processRefund, RefundServiceError } from "@/lib/refunds";
import { readBoundedJson } from "@/lib/bounded-json";
import { rateLimit } from "@/lib/rate-limit";
import { isBoundedRouteParam } from "@/lib/route-params";

const MAX_REFUND_ACTION_BODY_BYTES = 1_024;

// Separate from the student-facing PATCH /api/bookings/[id] on purpose —
// this is a privileged, audited action, not a general booking update.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const refundLimit = await rateLimit(`admin-refund:${session.user.id}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!refundLimit.ok) {
    return NextResponse.json(
      { error: "Too many refund actions. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, Math.ceil((refundLimit.resetAt - Date.now()) / 1000))) },
      },
    );
  }

  const { id } = await params;
  if (!isBoundedRouteParam(id)) {
    return NextResponse.json({ error: "Invalid booking." }, { status: 400 });
  }

  try {
    let manualConfirmation = false;
    if (req.body) {
      const body = await readBoundedJson(req, MAX_REFUND_ACTION_BODY_BYTES);
      if (!body.ok) {
        return NextResponse.json({ error: body.error }, { status: body.status });
      }
      if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) {
        return NextResponse.json({ error: "Invalid refund action." }, { status: 400 });
      }
      const value = (body.data as Record<string, unknown>).manualConfirmation;
      if (value !== undefined && typeof value !== "boolean") {
        return NextResponse.json({ error: "Invalid refund action." }, { status: 400 });
      }
      manualConfirmation = value === true;
    }

    const result = manualConfirmation
      ? await confirmManualRefund(id, session.user.id)
      : await processRefund(id, session.user.id);
    return NextResponse.json({
      data: result.booking,
      automatic: result.automatic,
      manualConfirmed: result.manualConfirmed,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/bookings/[id]/refund]", getSafeErrorSummary(err));
    if (err instanceof RefundServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: "Could not process the refund. Please try again." }, { status: 500 });
  }
}
