import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { createCheckoutSession } from "@/lib/safepay";
import { getRequestOrigin } from "@/lib/app-url";
import { PLANS } from "@/config/plans";

/** GET — return current plan + subscription info */
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      subscription: {
        select: { status: true, startDate: true, endDate: true, paymentRef: true },
      },
      _count: { select: { hostels: true } },
    },
  });

  return NextResponse.json({
    plan:         user?.plan ?? "FREE",
    subscription: user?.subscription ?? null,
    listingCount: user?._count.hostels ?? 0,
  });
}

/**
 * POST — initiate a Pro upgrade payment via Safepay.
 * Creates a PENDING subscription and returns a Safepay checkout URL.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where:  { id: session.user.id },
    select: { plan: true, name: true, email: true },
  });

  if (user?.plan === "PRO") {
    return NextResponse.json({ error: "Already on Pro plan" }, { status: 409 });
  }

  const appUrl = getRequestOrigin(req);

  // Create or update the pending subscription record
  const subscription = await db.subscription.upsert({
    where:  { userId: session.user.id },
    create: { userId: session.user.id, plan: "PRO", status: "PENDING" },
    update: { plan: "PRO", status: "PENDING", paymentRef: null },
  });

  // Create a Safepay checkout session for PKR 3,000
  const checkout = await createCheckoutSession({
    bookingId:   subscription.id,
    amount:      PLANS.PRO.price * 100,    // Safepay expects paise/smallest unit
    orderId:     `sub_${subscription.id}`, // prefixed so webhook can identify it
    customerName:  user?.name  ?? "",
    customerEmail: user?.email ?? "",
    appUrl,
    redirectPath: "/owner/subscription?upgraded=1",
    cancelPath:   "/owner/subscription?cancelled=1",
  });

  // Store the checkout token for payment support lookups.
  await db.subscription.update({
    where: { id: subscription.id },
    data:  { paymentRef: checkout.token },
  });

  return NextResponse.json({ checkoutUrl: checkout.redirectUrl });
}
