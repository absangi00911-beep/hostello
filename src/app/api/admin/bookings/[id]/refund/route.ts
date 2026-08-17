// Path: src/app/api/admin/bookings/[id]/refund/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { processRefund } from "@/lib/refunds";

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

  const { id } = await params;

  try {
    const result = await processRefund(id, session.user.id);
    return NextResponse.json({ data: result.booking, automatic: result.automatic });
  } catch (err) {
    console.error("[PATCH /api/admin/bookings/[id]/refund]", err);
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
