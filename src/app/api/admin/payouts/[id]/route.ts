// Path: src/app/api/admin/payouts/[id]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { markPayoutPaid } from "@/lib/payouts";
import { z } from "zod";

const markPaidSchema = z.object({
  reference: z.string().max(200).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = markPaidSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const payout = await markPayoutPaid(id, session.user.id, parsed.data.reference);
    return NextResponse.json({ data: payout });
  } catch (err) {
    console.error("[PATCH /api/admin/payouts/[id]]", err);
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
