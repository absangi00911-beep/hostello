import { addCalendarMonths } from "@hostello/shared";
import { db } from "@/lib/db";

/** Founder launch default: one calendar month paid, followed by a seven-day entitlement grace window. */
export const PRO_SUBSCRIPTION_TERM_MONTHS = 1;
export const PRO_SUBSCRIPTION_GRACE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getProTermEndDate(startDate: Date): Date {
  return addCalendarMonths(startDate, PRO_SUBSCRIPTION_TERM_MONTHS);
}

export function getProGraceEndDate(endDate: Date): Date {
  return new Date(endDate.getTime() + PRO_SUBSCRIPTION_GRACE_DAYS * DAY_MS);
}

export function isProEntitled(
  status: string | null | undefined,
  endDate: Date | null | undefined,
  now = new Date(),
): boolean {
  return status === "ACTIVE" && endDate !== null && endDate !== undefined &&
    Number.isFinite(endDate.getTime()) && getProGraceEndDate(endDate).getTime() > now.getTime();
}

async function expireOneProSubscription(
  subscription: { id: string; userId: string; endDate: Date; renewalPaymentRef: string | null },
  now: Date,
): Promise<boolean> {
  const cutoff = new Date(now.getTime() - PRO_SUBSCRIPTION_GRACE_DAYS * DAY_MS);
  return db.$transaction(async (tx) => {
    const beyondGrace = await tx.subscription.updateMany({
      where: {
        id: subscription.id,
        status: "ACTIVE",
        endDate: { lte: cutoff },
        renewalPaymentRef: subscription.renewalPaymentRef,
      },
      // Keep ACTIVE while an already-issued renewal checkout is outstanding so
      // its late success can still be applied; entitlement is evaluated by date.
      data: subscription.renewalPaymentRef ? { status: "ACTIVE" } : { status: "EXPIRED" },
    });
    if (beyondGrace.count === 0) return false;

    const downgraded = await tx.user.updateMany({
      where: { id: subscription.userId, plan: "PRO" },
      data: { plan: "FREE" },
    });
    return subscription.renewalPaymentRef ? downgraded.count > 0 : true;
  });
}

/** Idempotently expires one owner's Pro entitlement when its term and grace have ended. */
export async function expireProSubscriptionForUser(userId: string, now = new Date()): Promise<boolean> {
  const cutoff = new Date(now.getTime() - PRO_SUBSCRIPTION_GRACE_DAYS * DAY_MS);
  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: { id: true, userId: true, status: true, endDate: true, renewalPaymentRef: true },
  });
  const endDate = subscription?.endDate;
  if (!subscription || subscription.status !== "ACTIVE" || !endDate || endDate > cutoff) {
    return false;
  }

  return expireOneProSubscription({ ...subscription, endDate }, now);
}

/** Bounded idempotent expiry sweep; retries can safely revisit subscriptions not yet transitioned. */
export async function expireProSubscriptions(now = new Date(), batchSize = 100): Promise<number> {
  const cutoff = new Date(now.getTime() - PRO_SUBSCRIPTION_GRACE_DAYS * DAY_MS);
  const candidates = await db.subscription.findMany({
    where: { status: "ACTIVE", endDate: { lte: cutoff } },
    orderBy: [{ endDate: "asc" }, { id: "asc" }],
    take: batchSize,
    select: { id: true, userId: true, endDate: true, renewalPaymentRef: true },
  });

  let expiredCount = 0;
  for (const candidate of candidates) {
    const endDate = candidate.endDate;
    if (!endDate) continue;
    if (await expireOneProSubscription({ ...candidate, endDate }, now)) expiredCount++;
  }
  return expiredCount;
}
