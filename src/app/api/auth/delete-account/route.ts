import { type NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { auth, invalidateLocalSessionCache } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { readBoundedJson } from "@/lib/bounded-json";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { accountDeletedEmail } from "@/lib/email-templates/account-deleted";
import {
  enqueueAccountDeletion,
  removeDeletedOwnerHostelsFromSearch,
} from "@/lib/account-deletion";
import { setTokenVersion } from "@/lib/auth/token-version-cache";
import { getSafeErrorSummary } from "@/lib/safe-error";

const requestSchema = z.object({
  confirmation: z.literal("DELETE"),
  password: z.string().max(128).optional(),
}).strict();

const BLOCKED_MESSAGES = {
  active_bookings: "Resolve pending or future stays before requesting account deletion.",
  unpaid_payout: "Wait until all owner payouts and eligible balances are paid or voided.",
  refund_reconciliation: "Wait until any refund in progress has been reconciled.",
  pending_subscription: "Finish or cancel the pending plan payment before requesting account deletion.",
} as const;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role === "ADMIN") {
      return NextResponse.json({ error: "Administrator accounts cannot be deleted here." }, { status: 403 });
    }

    const limit = await rateLimit(`delete-account:${session.user.id}`, {
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const body = await readBoundedJson(request, 1_024);
    if (!body.ok) {
      return NextResponse.json({ error: body.error }, { status: body.status });
    }
    const parsed = requestSchema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json({ error: "Type DELETE to confirm account deletion." }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, password: true, role: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    if (user.role === "ADMIN") {
      return NextResponse.json({ error: "Administrator accounts cannot be deleted here." }, { status: 403 });
    }
    if (user.password) {
      const password = parsed.data.password;
      if (!password) {
        return NextResponse.json({ error: "Enter your password to confirm account deletion." }, { status: 400 });
      }
      if (!await compare(password, user.password)) {
        return NextResponse.json({ error: "Invalid password." }, { status: 403 });
      }
    }

    const result = await enqueueAccountDeletion(user.id);
    if (result.kind === "not_found") {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    if (result.kind === "already_queued") {
      return NextResponse.json({
        success: true,
        message: "Your account deletion request is already being processed.",
      }, { status: 202 });
    }
    if (result.kind === "blocked") {
      return NextResponse.json({ error: BLOCKED_MESSAGES[result.reason] }, { status: 409 });
    }

    // Replacing the cached version immediately makes every existing session stale.
    // If Redis is unavailable, the normal cache-miss path reads the incremented DB version.
    await invalidateLocalSessionCache(user.id);
    await setTokenVersion(user.id, result.tokenVersion);
    await removeDeletedOwnerHostelsFromSearch(result.activeHostelIds);

    const delivery = await sendEmail({
      to: result.email,
      ...accountDeletedEmail({ name: result.name }),
    });
    if (!delivery.success) {
      console.error("[account-deletion] Request confirmation email failed.");
    }

    return NextResponse.json({
      success: true,
      message: "Your account deletion request has been received and is being processed.",
    }, { status: 202 });
  } catch (error) {
    console.error("[POST /api/auth/delete-account]", getSafeErrorSummary(error));
    return NextResponse.json({ error: "Could not start account deletion. Try again shortly." }, { status: 500 });
  }
}
