import { db } from "@/lib/db";
import type { PlanKey } from "@/config/plans";
import { canAddListing } from "@/config/plans";

/** Returns the owner's current plan from DB */
export async function getOwnerPlan(userId: string): Promise<PlanKey> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  return (user?.plan ?? "FREE") as PlanKey;
}

/**
 * Checks whether an owner can create another listing.
 * Call this in POST /api/hostels before creating.
 */
export async function assertListingQuota(userId: string): Promise<void> {
  const [plan, count] = await Promise.all([
    getOwnerPlan(userId),
    db.hostel.count({ where: { ownerId: userId } }),
  ]);

  if (!canAddListing(plan, count)) {
    throw new QuotaExceededError(plan, count);
  }
}

export class QuotaExceededError extends Error {
  readonly plan: PlanKey;
  readonly currentCount: number;

  constructor(plan: PlanKey, currentCount: number) {
    super(`Listing quota exceeded for plan ${plan}`);
    this.name    = "QuotaExceededError";
    this.plan    = plan;
    this.currentCount = currentCount;
  }
}
