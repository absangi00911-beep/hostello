import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { createCheckoutLink, createCheckoutSession } from "@/lib/safepay";
import { getAppOrigin } from "@/lib/app-url";
import { PLANS } from "@/config/plans";
import { rateLimit } from "@/lib/rate-limit";
import { expireProSubscriptionForUser, isProEntitled } from "@/lib/pro-subscription";

/** GET — return current plan + subscription info */
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      subscription: {
        select: { status: true, startDate: true, endDate: true },
      },
      _count: { select: { hostels: true } },
    },
  });

  const entitled = isProEntitled(
    user?.subscription?.status,
    user?.subscription?.endDate,
  );
  return NextResponse.json({
    plan: user?.plan === "PRO" && entitled ? "PRO" : "FREE",
    subscription: user?.subscription
      ? {
          ...user.subscription,
          status: user.subscription.status === "ACTIVE" && !entitled
            ? "EXPIRED"
            : user.subscription.status,
        }
      : null,
    listingCount: user?._count.hostels ?? 0,
  });
}

/**
 * POST — initiate a Pro upgrade payment via Safepay.
 * Creates a PENDING subscription and returns a Safepay checkout URL.
 */
export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rl = await rateLimit(`owner-subscription:${session.user.id}`, {
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many checkout attempts. Try again later." }, { status: 429 });
  }

  // Self-heal expiry before deciding whether a new checkout may start; the cron
  // sweep is the routine path, while this protects owners if that job is delayed.
  await expireProSubscriptionForUser(session.user.id);

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, deletionRequestedAt: true },
  });

  if (!user || user.deletionRequestedAt) {
    return NextResponse.json({ error: "Account deletion is being processed." }, { status: 409 });
  }

  const appUrl = getAppOrigin();
  const subscription = await db.subscription.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, plan: "PRO", status: "PENDING" },
    // Reusing the unique row preserves active-period dates and any outstanding
    // renewal reference; the compare-and-set below resolves concurrent attempts.
    update: { plan: "PRO" },
  });

  const checkoutOptions = {
    bookingId: subscription.id,
    orderId: `sub_${subscription.id}`,
    appUrl,
    redirectPath: "/owner/subscription?upgraded=1",
    cancelPath: "/owner/subscription?cancelled=1",
  };
  const resumeCheckout = async (token: string) => {
    const checkout = await createCheckoutLink({ ...checkoutOptions, token });
    return NextResponse.json({ checkoutUrl: checkout.redirectUrl });
  };

  if (subscription.status === "ACTIVE") {
    if (subscription.renewalPaymentRef) {
      return resumeCheckout(subscription.renewalPaymentRef);
    }
    if (!isProEntitled(subscription.status, subscription.endDate)) {
      return NextResponse.json(
        { error: "Subscription changed while checkout was being prepared. Please retry." },
        { status: 409 },
      );
    }

    const checkout = await createCheckoutSession({
      amount: PLANS.PRO.price,
      customerName: user.name ?? "",
      customerEmail: user.email ?? "",
      ...checkoutOptions,
    });
    const saved = await db.subscription.updateMany({
      where: {
        id: subscription.id,
        status: "ACTIVE",
        endDate: subscription.endDate,
        renewalPaymentRef: null,
      },
      data: { renewalPaymentRef: checkout.token },
    });
    if (saved.count === 0) {
      const current = await db.subscription.findUnique({
        where: { id: subscription.id },
        select: { status: true, renewalPaymentRef: true },
      });
      if (current?.status === "ACTIVE" && current.renewalPaymentRef) {
        return resumeCheckout(current.renewalPaymentRef);
      }
      return NextResponse.json(
        { error: "Subscription changed while checkout was being prepared. Please retry." },
        { status: 409 },
      );
    }
    return NextResponse.json({ checkoutUrl: checkout.redirectUrl });
  }

  if (subscription.status === "PENDING" && subscription.paymentRef) {
    return resumeCheckout(subscription.paymentRef);
  }

  if (subscription.status !== "PENDING") {
    if (!["CANCELLED", "EXPIRED"].includes(subscription.status)) {
      return NextResponse.json(
        { error: "Subscription changed while checkout was being prepared. Please retry." },
        { status: 409 },
      );
    }

    const reset = await db.subscription.updateMany({
      where: {
        id: subscription.id,
        status: subscription.status,
        paymentRef: subscription.paymentRef,
        renewalPaymentRef: null,
      },
      data: { plan: "PRO", status: "PENDING", paymentRef: null },
    });
    if (reset.count === 0) {
      const current = await db.subscription.findUnique({
        where: { id: subscription.id },
        select: { status: true, paymentRef: true },
      });
      if (current?.status === "PENDING" && current.paymentRef) {
        return resumeCheckout(current.paymentRef);
      }
      return NextResponse.json(
        { error: "Subscription changed while checkout was being prepared. Please retry." },
        { status: 409 },
      );
    }
  }

  const checkout = await createCheckoutSession({
    amount: PLANS.PRO.price,
    customerName: user.name ?? "",
    customerEmail: user.email ?? "",
    ...checkoutOptions,
  });
  const saved = await db.subscription.updateMany({
    where: { id: subscription.id, status: "PENDING", paymentRef: null },
    data: { paymentRef: checkout.token },
  });
  if (saved.count === 0) {
    const current = await db.subscription.findUnique({
      where: { id: subscription.id },
      select: { status: true, paymentRef: true },
    });
    if (current?.status === "PENDING" && current.paymentRef) {
      return resumeCheckout(current.paymentRef);
    }
    return NextResponse.json(
      { error: "Subscription changed while checkout was being prepared. Please retry." },
      { status: 409 },
    );
  }

  return NextResponse.json({ checkoutUrl: checkout.redirectUrl });
}
