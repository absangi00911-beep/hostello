// Path: src/lib/safepay-subscription-events.ts
//
// Settlement of Pro subscription payments reported by Safepay.
import { NextResponse } from "next/server";
import { PLANS } from "@/config/plans";
import { db } from "@/lib/db";
import { logOperationalEvent, type OperationalLogContext } from "@/lib/operational-logger";
import { getProGraceEndDate, getProTermEndDate } from "@/lib/pro-subscription";
import { toSafepayMinorUnits } from "@/lib/safepay";
import { isValidPkrAmount } from "@/lib/safepay-event-fields";
import type { SafepayEvent } from "@/lib/safepay-webhook-auth";

export async function handleFailedSubscriptionPayment(
  orderId: string,
  tracker: string,
  event: SafepayEvent,
  logContext: OperationalLogContext,
) {
  const subscriptionId = orderId.slice("sub_".length);
  if (!subscriptionId || !isValidPkrAmount(event, toSafepayMinorUnits(PLANS.PRO.price))) {
    return NextResponse.json({ error: "Subscription payment amount or reference is invalid." }, { status: 400 });
  }

  const subscription = await db.subscription.findUnique({
    where: { id: subscriptionId },
    select: { id: true, status: true, paymentRef: true, renewalPaymentRef: true },
  });
  if (!subscription) return NextResponse.json({ error: "Subscription not found." }, { status: 404 });

  const initialPayment = subscription.status === "PENDING" && subscription.paymentRef === tracker;
  const renewalPayment = subscription.status === "ACTIVE" && subscription.renewalPaymentRef === tracker;
  if (!initialPayment && !renewalPayment) {
    logOperationalEvent("warn", "subscription.payment_failed_stale", {
      subscription_id: subscriptionId,
      reason: "tracker_mismatch",
    }, logContext);
    return NextResponse.json({ received: true });
  }

  const result = initialPayment
    ? await db.subscription.updateMany({
        where: { id: subscriptionId, status: "PENDING", paymentRef: tracker },
        data: { status: "CANCELLED", paymentRef: null },
      })
    : await db.subscription.updateMany({
        where: { id: subscriptionId, status: "ACTIVE", renewalPaymentRef: tracker },
        data: { renewalPaymentRef: null },
      });
  logOperationalEvent(result.count === 1 ? "info" : "warn", result.count === 1
    ? "subscription.payment_failed"
    : "subscription.payment_failed_stale", {
    subscription_id: subscriptionId,
    reason: result.count === 1 ? (initialPayment ? "initial_payment_failed" : "renewal_payment_failed") : "subscription_state_changed",
  }, logContext);
  return NextResponse.json({ received: true });
}

export async function handleSubscriptionPayment(
  orderId: string,
  tracker: string,
  event: SafepayEvent,
  logContext: OperationalLogContext,
) {
  const subscriptionId = orderId.slice("sub_".length);
  if (!subscriptionId || !isValidPkrAmount(event, toSafepayMinorUnits(PLANS.PRO.price))) {
    logOperationalEvent("error", "payment.reconciliation_required", {
      entity_type: "subscription",
      entity_id: subscriptionId || "unknown",
      reason: "amount_or_reference_invalid",
    }, logContext);
    return NextResponse.json({ error: "Subscription payment amount or reference is invalid." }, { status: 400 });
  }

  const subscription = await db.subscription.findUnique({
    where: { id: subscriptionId },
    select: {
      id: true,
      userId: true,
      status: true,
      paymentRef: true,
      renewalPaymentRef: true,
      endDate: true,
    },
  });
  if (!subscription) {
    logOperationalEvent("error", "payment.reconciliation_required", {
      entity_type: "subscription",
      entity_id: subscriptionId,
      reason: "subscription_not_found",
    }, logContext);
    return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
  }

  if (subscription.status === "ACTIVE" && subscription.paymentRef === tracker) {
    return NextResponse.json({ received: true });
  }
  const initialPayment = subscription.status === "PENDING" && subscription.paymentRef === tracker;
  const renewalPayment = subscription.status === "ACTIVE" && subscription.renewalPaymentRef === tracker;
  if (!initialPayment && !renewalPayment) {
    logOperationalEvent("error", "payment.reconciliation_required", {
      entity_type: "subscription",
      entity_id: subscriptionId,
      reason: "subscription_reference_mismatch",
    }, logContext);
    return NextResponse.json({ error: "Subscription payment requires reconciliation." }, { status: 409 });
  }

  const now = new Date();
  const renewalAnchor = subscription.endDate && getProGraceEndDate(subscription.endDate) > now
    ? subscription.endDate
    : now;
  const nextEndDate = getProTermEndDate(initialPayment ? now : renewalAnchor);
  const activated = await db.$transaction(async (tx) => {
    const result = initialPayment
      ? await tx.subscription.updateMany({
          where: { id: subscriptionId, status: "PENDING", paymentRef: tracker },
          data: { status: "ACTIVE", startDate: now, endDate: nextEndDate },
        })
      : await tx.subscription.updateMany({
          where: {
            id: subscriptionId,
            status: "ACTIVE",
            renewalPaymentRef: tracker,
            endDate: subscription.endDate,
          },
          data: {
            paymentRef: tracker,
            renewalPaymentRef: null,
            startDate: renewalAnchor,
            endDate: nextEndDate,
          },
        });
    if (result.count === 0) return false;

    await tx.user.update({ where: { id: subscription.userId }, data: { plan: "PRO" } });
    if (initialPayment) {
      // Written with the paid period so retries cannot duplicate the notice.
      await tx.notification.create({
        data: {
          userId: subscription.userId,
          type: "HOSTEL_APPROVED",
          title: "Welcome to HostelLo Pro!",
          message: "Your Pro subscription is now active. Unlimited listings and featured placement are enabled.",
        },
      });
    }
    return true;
  });

  if (!activated) {
    const current = await db.subscription.findUnique({
      where: { id: subscriptionId },
      select: { status: true, paymentRef: true },
    });
    if (current?.status === "ACTIVE" && current.paymentRef === tracker) {
      return NextResponse.json({ received: true });
    }
    logOperationalEvent("error", "payment.reconciliation_required", {
      entity_type: "subscription",
      entity_id: subscriptionId,
      reason: "subscription_changed_during_activation",
    }, logContext);
    return NextResponse.json({ error: "Subscription payment requires reconciliation." }, { status: 409 });
  }

  logOperationalEvent("info", initialPayment ? "subscription.payment_activated" : "subscription.payment_renewed", {
    subscription_id: subscriptionId,
  }, logContext);
  return NextResponse.json({ received: true });
}
