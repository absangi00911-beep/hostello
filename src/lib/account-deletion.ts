import { createHash } from "node:crypto";
import type { Prisma } from "@/generated/client";
import { db } from "@/lib/db";
import { getEligiblePayoutBookingWhere } from "@/lib/payouts";
import { deleteVerificationDocument, isVerificationObjectKey } from "@/lib/verification-storage";
import { removeHostelIndex } from "@/lib/typesense-sync";
import { getSafeErrorSummary } from "@/lib/safe-error";

export const ACCOUNT_DELETION_BATCH_SIZE = 100;
const STALE_CLAIM_MS = 15 * 60 * 1000;
const MAX_JOBS_PER_RUN = 10;
const MAX_BLOCKED_RETRIES_PER_RUN = 1;
const BLOCKED_RETRY_INTERVAL_MS = 60 * 60 * 1000;

const PHASES = [
  "NOTIFICATIONS",
  "MESSAGES",
  "PARTICIPANTS",
  "FAVORITES",
  "PRICE_ALERTS",
  "ROOMMATE_REPORTS",
  "ROOMMATE_POSTS",
  "REVIEWS",
  "DEVICE_TOKENS",
  "RESET_TOKENS",
  "PHONE_TOKENS",
  "SESSIONS",
  "ACCOUNTS",
  "BOOKINGS",
  "HOSTELS",
  "PRIVATE_DOCUMENT",
  "ANONYMIZE_BOOKINGS",
  "ANONYMIZE_PAYOUTS",
  "FINALIZE",
  "COMPLETED",
] as const;

type DeletionPhase = (typeof PHASES)[number];
type DeletionTx = Prisma.TransactionClient;

const FINANCIAL_BOOKING_WHERE: Prisma.BookingWhereInput = {
  OR: [
    { paymentStatus: { in: ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"] } },
    { transactionId: { not: null } },
    { refundedAmount: { gt: 0 } },
    { payoutId: { not: null } },
  ],
};

const DELETABLE_BOOKING_WHERE: Prisma.BookingWhereInput = {
  status: { in: ["PENDING", "CANCELLED"] },
  paymentStatus: { in: ["PENDING", "FAILED"] },
  transactionId: null,
  payoutId: null,
  refundedAmount: 0,
};

export type AccountDeletionStartResult =
  | { kind: "queued"; email: string; name: string; activeHostelIds: string[]; tokenVersion: number }
  | { kind: "already_queued" }
  | { kind: "not_found" }
  | { kind: "blocked"; reason: "active_bookings" | "unpaid_payout" | "refund_reconciliation" | "pending_subscription" };

/** Create one deletion job and revoke sessions before any background cleanup begins. */
export async function enqueueAccountDeletion(userId: string): Promise<AccountDeletionStartResult> {
  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        deletionRequestedAt: true,
        verificationDocUrl: true,
      },
    });
    if (!user) return { kind: "not_found" };
    if (user.deletionRequestedAt) return { kind: "already_queued" };

    const activeBooking = await tx.booking.findFirst({
      where: {
        AND: [
          { OR: [{ userId }, { hostel: { is: { ownerId: userId } } }] },
          { OR: [{ status: "PENDING" }, { status: "CONFIRMED", checkOut: { gt: new Date() } }] },
        ],
      },
      select: { id: true },
    });
    if (activeBooking) return { kind: "blocked", reason: "active_bookings" };

    const pendingPayout = user.role === "OWNER"
      ? await tx.payout.findFirst({ where: { ownerId: userId, status: "PENDING" }, select: { id: true } })
      : null;
    const pendingSubscription = user.role === "OWNER"
      ? await tx.subscription.findFirst({ where: { userId, status: "PENDING" }, select: { id: true } })
      : null;
    if (pendingSubscription) return { kind: "blocked", reason: "pending_subscription" };
    const unpaidBalance = user.role === "OWNER"
      ? await tx.booking.findFirst({
          where: { ...getEligiblePayoutBookingWhere(), hostel: { is: { ownerId: userId } } },
          select: { id: true },
        })
      : null;
    if (pendingPayout || unpaidBalance) return { kind: "blocked", reason: "unpaid_payout" };

    const unresolvedRefund = await tx.booking.findFirst({
      where: {
        status: "CANCELLED",
        paymentStatus: { in: ["PAID", "PARTIALLY_REFUNDED"] },
        refundState: { in: ["PROCESSING", "UNCERTAIN"] },
        OR: [
          { userId },
          { hostel: { is: { ownerId: userId } } },
        ],
      },
      select: { id: true },
    });
    if (unresolvedRefund) return { kind: "blocked", reason: "refund_reconciliation" };

    const [payout, financialBooking, subscription, activeHostels] = await Promise.all([
      tx.payout.findFirst({ where: { ownerId: userId }, select: { id: true } }),
      tx.booking.findFirst({
        where: {
          AND: [
            FINANCIAL_BOOKING_WHERE,
            { OR: [{ userId }, { hostel: { is: { ownerId: userId } } }] },
          ],
        },
        select: { id: true },
      }),
    tx.subscription.findFirst({ where: { userId }, select: { id: true } }),
      tx.hostel.findMany({ where: { ownerId: userId, status: "ACTIVE" }, select: { id: true }, take: 100 }),
    ]);

    const subjectHash = createHash("sha256").update(userId).digest("hex");
    const verificationObjectKey = user.verificationDocUrl &&
      isVerificationObjectKey(user.verificationDocUrl, userId)
      ? user.verificationDocUrl
      : null;

    await tx.verificationToken.deleteMany({ where: { identifier: user.email } });
    await tx.accountDeletionJob.create({
      data: {
        userId,
        subjectHash,
        phase: "NOTIFICATIONS",
        status: "PENDING",
        retainsFinancialHistory: Boolean(payout || financialBooking || subscription),
        verificationObjectKey,
      },
    });
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        deletionRequestedAt: new Date(),
        tokenVersion: { increment: 1 },
        verificationDocUrl: null,
        verificationStatus: "NONE",
        studentVerified: false,
      },
      select: { tokenVersion: true },
    });
    await tx.hostel.updateMany({
      where: { ownerId: userId, status: "ACTIVE" },
      data: { status: "SUSPENDED" },
    });

    return {
      kind: "queued",
      email: user.email,
      name: user.name,
      activeHostelIds: activeHostels.map(({ id }) => id),
      tokenVersion: updatedUser.tokenVersion,
    };
  });
}

export async function removeDeletedOwnerHostelsFromSearch(hostelIds: string[]) {
  for (let start = 0; start < hostelIds.length; start += 10) {
    const batch = hostelIds.slice(start, start + 10);
    await Promise.all(batch.map(async (hostelId) => {
      try {
        await removeHostelIndex(hostelId);
      } catch (error) {
        console.warn("[account-deletion] Search index removal failed:", getSafeErrorSummary(error));
      }
    }));
  }
}

/** Process one bounded batch for each due deletion job, rotating by last progress time. */
export async function processAccountDeletionQueue() {
  const staleBefore = new Date(Date.now() - STALE_CLAIM_MS);
  const dueJobs = await db.accountDeletionJob.findMany({
    where: {
      OR: [
        { status: "PENDING" },
        { status: "PROCESSING", updatedAt: { lt: staleBefore } },
      ],
    },
    orderBy: { updatedAt: "asc" },
    take: MAX_JOBS_PER_RUN,
    select: { id: true },
  });
  const blockedSlots = Math.min(
    MAX_BLOCKED_RETRIES_PER_RUN,
    Math.max(0, MAX_JOBS_PER_RUN - dueJobs.length),
  );
  const blockedJobs = blockedSlots > 0
    ? await db.accountDeletionJob.findMany({
        where: {
          status: "BLOCKED",
          updatedAt: { lt: new Date(Date.now() - BLOCKED_RETRY_INTERVAL_MS) },
        },
        orderBy: { updatedAt: "asc" },
        take: blockedSlots,
        select: { id: true },
      })
    : [];

  let batches = 0;
  let completed = 0;
  let blocked = 0;
  for (const job of [...dueJobs, ...blockedJobs]) {
    const result = await processOneAccountDeletion(job.id);
    if (result === "batch") batches += 1;
    if (result === "completed") completed += 1;
    if (result === "blocked") blocked += 1;
  }

  return { message: "Account deletion queue processed", count: batches, completed, blocked };
}

async function processOneAccountDeletion(jobId: string): Promise<"batch" | "completed" | "blocked" | "busy"> {
  const staleBefore = new Date(Date.now() - STALE_CLAIM_MS);
  const claimed = await db.accountDeletionJob.updateMany({
    where: {
      id: jobId,
      OR: [
        { status: { in: ["PENDING", "BLOCKED"] } },
        { status: "PROCESSING", updatedAt: { lt: staleBefore } },
      ],
    },
    data: { status: "PROCESSING", attemptCount: { increment: 1 }, lastErrorCode: null },
  });
  if (claimed.count !== 1) return "busy";

  try {
    for (let transition = 0; transition < PHASES.length; transition += 1) {
      const job = await db.accountDeletionJob.findUnique({ where: { id: jobId } });
      if (!job || job.status === "COMPLETED") return "completed";
      const phase = job.phase as DeletionPhase;

      if (phase === "PRIVATE_DOCUMENT") {
        if (job.verificationObjectKey) {
          await deleteVerificationDocument(job.verificationObjectKey);
          await db.$transaction(async (tx) => {
            if (job.userId) {
              await tx.user.updateMany({
                where: { id: job.userId },
                data: {
                  verificationDocUrl: null,
                  verificationStatus: "NONE",
                  verificationSubmittedAt: null,
                  verificationDecidedAt: null,
                  studentVerified: false,
                },
              });
            }
            await tx.accountDeletionJob.update({
              where: { id: jobId },
              data: { verificationObjectKey: null, phase: nextPhase(phase), status: "PENDING", cursor: null },
            });
          });
          return "batch";
        }
      }

      const result = await db.$transaction(async (tx) => {
        const currentJob = await tx.accountDeletionJob.findUnique({ where: { id: jobId } });
        if (!currentJob || !currentJob.userId) {
          await tx.accountDeletionJob.update({
            where: { id: jobId },
            data: { status: "COMPLETED", phase: "COMPLETED", completedAt: new Date(), userId: null },
          });
          return "completed" as const;
        }
        const currentPhase = currentJob.phase as DeletionPhase;

        if (
          currentPhase === "BOOKINGS" ||
          currentPhase === "ANONYMIZE_BOOKINGS" ||
          currentPhase === "ANONYMIZE_PAYOUTS" ||
          currentPhase === "HOSTELS" ||
          currentPhase === "FINALIZE"
        ) {
          const blocked = await getDeletionBlockReason(tx, currentJob.userId);
          if (blocked) {
            await tx.accountDeletionJob.update({
              where: { id: jobId },
              data: { status: "BLOCKED", lastErrorCode: blocked },
            });
            return "blocked" as const;
          }
        }

        if (currentPhase === "HOSTELS") return "hostels" as const;
        if (currentPhase === "FINALIZE") {
          return finalizeDeletion(tx, currentJob);
        }
        if (currentPhase === "COMPLETED") return "completed" as const;

        const batch = await fetchPhaseBatch(tx, currentPhase, currentJob.userId);
        if (
          batch.ids.length > 0 ||
          (batch.reviews?.length ?? 0) > 0 ||
          (batch.phoneTokens?.length ?? 0) > 0
        ) {
          await deletePhaseBatch(tx, currentPhase, currentJob.userId, batch);
          await tx.accountDeletionJob.update({
            where: { id: jobId },
            data: { status: "PENDING", lastErrorCode: null },
          });
          return "batch" as const;
        }

        await tx.accountDeletionJob.update({
          where: { id: jobId },
          data: { phase: nextPhase(currentPhase), cursor: null, status: "PROCESSING", lastErrorCode: null },
        });
        return "advanced" as const;
      });

      if (result === "hostels") {
        return await processHostelBatch(jobId, job.userId);
      }
      if (result === "advanced") continue;
      return result;
    }
    return "busy";
  } catch (error) {
    const summary = getSafeErrorSummary(error);
    await db.accountDeletionJob.updateMany({
      where: { id: jobId, status: "PROCESSING" },
      data: { status: "PENDING", lastErrorCode: summary.code ?? summary.name },
    }).catch(() => undefined);
    throw error;
  }
}

async function fetchPhaseBatch(tx: DeletionTx, phase: DeletionPhase, userId: string) {
  switch (phase) {
    case "NOTIFICATIONS":
      return { ids: (await tx.notification.findMany({ where: { userId }, orderBy: { id: "asc" }, take: ACCOUNT_DELETION_BATCH_SIZE, select: { id: true } })).map((row) => row.id) };
    case "MESSAGES":
      return { ids: (await tx.message.findMany({ where: { senderId: userId }, orderBy: { id: "asc" }, take: ACCOUNT_DELETION_BATCH_SIZE, select: { id: true } })).map((row) => row.id) };
    case "PARTICIPANTS":
      return { ids: (await tx.conversationParticipant.findMany({ where: { userId }, orderBy: { id: "asc" }, take: ACCOUNT_DELETION_BATCH_SIZE, select: { id: true } })).map((row) => row.id) };
    case "FAVORITES":
      return { ids: (await tx.favorite.findMany({ where: { userId }, orderBy: { id: "asc" }, take: ACCOUNT_DELETION_BATCH_SIZE, select: { id: true } })).map((row) => row.id) };
    case "PRICE_ALERTS":
      return { ids: (await tx.priceAlert.findMany({ where: { userId }, orderBy: { id: "asc" }, take: ACCOUNT_DELETION_BATCH_SIZE, select: { id: true } })).map((row) => row.id) };
    case "ROOMMATE_REPORTS":
      return { ids: (await tx.roommateReport.findMany({ where: { reporterId: userId }, orderBy: { id: "asc" }, take: ACCOUNT_DELETION_BATCH_SIZE, select: { id: true } })).map((row) => row.id) };
    case "ROOMMATE_POSTS":
      return { ids: (await tx.roommatePost.findMany({ where: { userId }, orderBy: { id: "asc" }, take: ACCOUNT_DELETION_BATCH_SIZE, select: { id: true } })).map((row) => row.id) };
    case "REVIEWS":
      return { reviews: await tx.review.findMany({ where: { userId }, orderBy: { id: "asc" }, take: ACCOUNT_DELETION_BATCH_SIZE, select: { id: true, hostelId: true } }), ids: [] as string[] };
    case "DEVICE_TOKENS":
      return { ids: (await tx.deviceToken.findMany({ where: { userId }, orderBy: { id: "asc" }, take: ACCOUNT_DELETION_BATCH_SIZE, select: { id: true } })).map((row) => row.id) };
    case "RESET_TOKENS":
      return { ids: (await tx.passwordResetToken.findMany({ where: { userId }, orderBy: { id: "asc" }, take: ACCOUNT_DELETION_BATCH_SIZE, select: { id: true } })).map((row) => row.id) };
    case "PHONE_TOKENS":
      return {
        ids: [] as string[],
        phoneTokens: await tx.phoneVerificationToken.findMany({
          where: { userId },
          orderBy: [{ phone: "asc" }, { otp: "asc" }],
          take: ACCOUNT_DELETION_BATCH_SIZE,
          select: { phone: true, otp: true },
        }),
      };
    case "SESSIONS":
      return { ids: (await tx.session.findMany({ where: { userId }, orderBy: { id: "asc" }, take: ACCOUNT_DELETION_BATCH_SIZE, select: { id: true } })).map((row) => row.id) };
    case "ACCOUNTS":
      return { ids: (await tx.account.findMany({ where: { userId }, orderBy: { id: "asc" }, take: ACCOUNT_DELETION_BATCH_SIZE, select: { id: true } })).map((row) => row.id) };
    case "BOOKINGS":
      return { ids: (await tx.booking.findMany({
        where: {
          ...DELETABLE_BOOKING_WHERE,
          OR: [{ userId }, { hostel: { is: { ownerId: userId } } }],
        },
        orderBy: { id: "asc" },
        take: ACCOUNT_DELETION_BATCH_SIZE,
        select: { id: true },
      })).map((row) => row.id) };
    case "ANONYMIZE_BOOKINGS":
      return { ids: (await tx.booking.findMany({
        where: { userId, notes: { not: null } },
        orderBy: { id: "asc" },
        take: ACCOUNT_DELETION_BATCH_SIZE,
        select: { id: true },
      })).map((row) => row.id) };
    case "ANONYMIZE_PAYOUTS":
      return { ids: (await tx.payout.findMany({
        where: { ownerId: userId, destinationSnapshot: { not: null } },
        orderBy: { id: "asc" },
        take: ACCOUNT_DELETION_BATCH_SIZE,
        select: { id: true },
      })).map((row) => row.id) };
    default:
      return { ids: [] as string[] };
  }
}

async function deletePhaseBatch(
  tx: DeletionTx,
  phase: DeletionPhase,
  userId: string,
  batch: {
    ids: string[];
    reviews?: Array<{ id: string; hostelId: string }>;
    phoneTokens?: Array<{ phone: string; otp: string }>;
  },
) {
  const ids = batch.ids;
  switch (phase) {
    case "NOTIFICATIONS": await tx.notification.deleteMany({ where: { id: { in: ids }, userId } }); return;
    case "MESSAGES": await tx.message.deleteMany({ where: { id: { in: ids }, senderId: userId } }); return;
    case "PARTICIPANTS": await tx.conversationParticipant.deleteMany({ where: { id: { in: ids }, userId } }); return;
    case "FAVORITES": await tx.favorite.deleteMany({ where: { id: { in: ids }, userId } }); return;
    case "PRICE_ALERTS": await tx.priceAlert.deleteMany({ where: { id: { in: ids }, userId } }); return;
    case "ROOMMATE_REPORTS": await tx.roommateReport.deleteMany({ where: { id: { in: ids }, reporterId: userId } }); return;
    case "ROOMMATE_POSTS": await tx.roommatePost.deleteMany({ where: { id: { in: ids }, userId } }); return;
    case "REVIEWS": {
      const reviews = batch.reviews ?? [];
      await tx.review.deleteMany({ where: { id: { in: reviews.map(({ id }) => id) }, userId } });
      const hostelIds = [...new Set(reviews.map(({ hostelId }) => hostelId))];
      const aggregates = hostelIds.length > 0
        ? await tx.review.groupBy({
            by: ["hostelId"],
            where: { hostelId: { in: hostelIds } },
            _avg: { rating: true },
            _count: { _all: true },
          })
        : [];
      const aggregateByHostel = new Map(aggregates.map((aggregate) => [aggregate.hostelId, aggregate]));
      for (const hostelId of hostelIds) {
        const aggregate = aggregateByHostel.get(hostelId);
        await tx.hostel.update({
          where: { id: hostelId },
          data: {
            rating: aggregate?._avg.rating ?? 0,
            reviewCount: aggregate?._count._all ?? 0,
          },
        });
      }
      return;
    }
    case "DEVICE_TOKENS": await tx.deviceToken.deleteMany({ where: { id: { in: ids }, userId } }); return;
    case "RESET_TOKENS": await tx.passwordResetToken.deleteMany({ where: { id: { in: ids }, userId } }); return;
    case "PHONE_TOKENS": {
      const phoneTokens = batch.phoneTokens ?? [];
      await tx.phoneVerificationToken.deleteMany({
        where: {
          userId,
          OR: phoneTokens.map(({ phone, otp }) => ({ phone, otp })),
        },
      });
      return;
    }
    case "SESSIONS": await tx.session.deleteMany({ where: { id: { in: ids }, userId } }); return;
    case "ACCOUNTS": await tx.account.deleteMany({ where: { id: { in: ids }, userId } }); return;
    case "BOOKINGS": await tx.booking.deleteMany({ where: { id: { in: ids }, ...DELETABLE_BOOKING_WHERE } }); return;
    case "ANONYMIZE_BOOKINGS":
      await tx.booking.updateMany({ where: { id: { in: ids }, userId }, data: { notes: null } });
      return;
    case "ANONYMIZE_PAYOUTS":
      await tx.payout.updateMany({ where: { id: { in: ids }, ownerId: userId }, data: { destinationSnapshot: null } });
      return;
    default: return;
  }
}

async function processHostelBatch(jobId: string, userId: string | null): Promise<"batch" | "completed" | "blocked" | "busy"> {
  if (!userId) return "completed";
  const job = await db.accountDeletionJob.findUnique({ where: { id: jobId }, select: { cursor: true } });
  const hostels = await db.hostel.findMany({
    where: { ownerId: userId, ...(job?.cursor ? { id: { gt: job.cursor } } : {}) },
    orderBy: { id: "asc" },
    take: ACCOUNT_DELETION_BATCH_SIZE,
    select: { id: true },
  });
  if (hostels.length === 0) {
    await db.accountDeletionJob.update({ where: { id: jobId }, data: { phase: "PRIVATE_DOCUMENT", cursor: null, status: "PENDING" } });
    return "batch";
  }

  const ids = hostels.map(({ id }) => id);
  await removeDeletedOwnerHostelsFromSearch(ids);
  const lastId = ids[ids.length - 1];
  await db.$transaction(async (tx) => {
    await tx.hostel.updateMany({ where: { id: { in: ids }, ownerId: userId }, data: { status: "SUSPENDED" } });
    const emptyHostels = await tx.hostel.findMany({
      where: { id: { in: ids }, ownerId: userId, bookings: { none: {} } },
      select: { id: true },
    });
    if (emptyHostels.length > 0) {
      const emptyHostelIds = emptyHostels.map(({ id }) => id);
      await tx.review.deleteMany({ where: { hostelId: { in: emptyHostelIds } } });
      await tx.hostel.deleteMany({ where: { id: { in: emptyHostels.map(({ id }) => id) }, ownerId: userId, bookings: { none: {} } } });
    }
    await tx.accountDeletionJob.update({ where: { id: jobId }, data: { cursor: lastId, status: "PENDING" } });
  });
  return "batch";
}

async function finalizeDeletion(tx: DeletionTx, job: {
  id: string;
  userId: string | null;
  subjectHash: string;
  retainsFinancialHistory: boolean;
}) {
  if (!job.userId) {
    await tx.accountDeletionJob.update({ where: { id: job.id }, data: { status: "COMPLETED", phase: "COMPLETED", completedAt: new Date() } });
    return "completed" as const;
  }

  const userId = job.userId;
  const [payout, financialBooking, subscription, remainingBooking] = await Promise.all([
    tx.payout.findFirst({ where: { ownerId: userId }, select: { id: true } }),
    tx.booking.findFirst({
      where: {
        AND: [
          FINANCIAL_BOOKING_WHERE,
          { OR: [{ userId }, { hostel: { is: { ownerId: userId } } }] },
        ],
      },
      select: { id: true },
    }),
      tx.subscription.findFirst({ where: { userId }, select: { id: true } }),
    tx.booking.findFirst({
      where: { OR: [{ userId }, { hostel: { is: { ownerId: userId } } }] },
      select: { id: true },
    }),
  ]);
  const retain = job.retainsFinancialHistory || Boolean(payout || financialBooking || subscription || remainingBooking);

  if (retain) {
    const [bookingNote, payoutDestination] = await Promise.all([
      tx.booking.findFirst({ where: { userId, notes: { not: null } }, select: { id: true } }),
      tx.payout.findFirst({ where: { ownerId: userId, destinationSnapshot: { not: null } }, select: { id: true } }),
    ]);
    if (bookingNote || payoutDestination) {
      await tx.accountDeletionJob.update({
        where: { id: job.id },
        data: {
          phase: bookingNote ? "ANONYMIZE_BOOKINGS" : "ANONYMIZE_PAYOUTS",
          cursor: null,
          status: "PENDING",
        },
      });
      return "batch" as const;
    }
    await tx.subscription.updateMany({
      where: { userId, status: "ACTIVE" },
      data: { status: "CANCELLED", endDate: new Date() },
    });
    await tx.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${job.subjectHash.slice(0, 32)}@deleted.hostello.invalid`,
        emailVerified: null,
        password: null,
        name: "Deleted account",
        phone: null,
        phoneVerified: null,
        avatar: null,
        bio: null,
        city: null,
        emailNotifications: false,
        studentVerified: false,
        verificationStatus: "NONE",
        verificationDocUrl: null,
        verificationSubmittedAt: null,
        verificationDecidedAt: null,
        verifiedById: null,
        plan: "FREE",
        bankAccountTitle: null,
        bankAccountNumber: null,
        bankName: null,
      },
    });
  } else {
    const [booking, message, review, hostel] = await Promise.all([
      tx.booking.findFirst({ where: { userId }, select: { id: true } }),
      tx.message.findFirst({ where: { senderId: userId }, select: { id: true } }),
      tx.review.findFirst({ where: { userId }, select: { id: true } }),
      tx.hostel.findFirst({ where: { ownerId: userId }, select: { id: true } }),
    ]);
    const remainingPhase = booking
      ? "BOOKINGS"
      : message
        ? "MESSAGES"
        : review
          ? "REVIEWS"
          : hostel
            ? "HOSTELS"
            : null;
    if (remainingPhase) {
      await tx.accountDeletionJob.update({
        where: { id: job.id },
        data: { phase: remainingPhase, cursor: null, status: "PENDING" },
      });
      return "batch" as const;
    }
    await tx.user.delete({ where: { id: userId } });
  }

  await tx.accountDeletionJob.update({
    where: { id: job.id },
    data: {
      userId: null,
      retainsFinancialHistory: retain,
      verificationObjectKey: null,
      cursor: null,
      phase: "COMPLETED",
      status: "COMPLETED",
      completedAt: new Date(),
      lastErrorCode: null,
    },
  });
  return "completed" as const;
}

async function getDeletionBlockReason(tx: DeletionTx, userId: string) {
  const now = new Date();
  const [active, pendingPayout, pendingSubscription, unpaidBalance, unresolvedRefund] = await Promise.all([
    tx.booking.findFirst({
      where: {
        AND: [
          { OR: [{ userId }, { hostel: { is: { ownerId: userId } } }] },
          { OR: [{ status: "PENDING" }, { status: "CONFIRMED", checkOut: { gt: now } }] },
        ],
      },
      select: { id: true },
    }),
    tx.payout.findFirst({ where: { ownerId: userId, status: "PENDING" }, select: { id: true } }),
    tx.subscription.findFirst({ where: { userId, status: "PENDING" }, select: { id: true } }),
    tx.booking.findFirst({
      where: { ...getEligiblePayoutBookingWhere(), hostel: { is: { ownerId: userId } } },
      select: { id: true },
    }),
    tx.booking.findFirst({
      where: {
        status: "CANCELLED",
        paymentStatus: { in: ["PAID", "PARTIALLY_REFUNDED"] },
        refundState: { in: ["PROCESSING", "UNCERTAIN"] },
        OR: [{ userId }, { hostel: { is: { ownerId: userId } } }],
      },
      select: { id: true },
    }),
  ]);
  if (active) return "active_bookings";
  if (pendingPayout || unpaidBalance) return "unpaid_payout";
  if (pendingSubscription) return "pending_subscription";
  if (unresolvedRefund) return "refund_reconciliation";
  return null;
}

function nextPhase(phase: DeletionPhase): DeletionPhase {
  const index = PHASES.indexOf(phase);
  return PHASES[Math.min(index + 1, PHASES.length - 1)];
}
