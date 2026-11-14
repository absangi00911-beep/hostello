// Path: src/lib/verification-retention.ts
import { db } from "@/lib/db";
import {
  deleteLegacyPublicVerificationDocument,
  isLegacyPublicDocumentUrl,
} from "@/lib/legacy-verification-docs";
import { createNotification } from "@/lib/notifications";
import { logOperationalEvent } from "@/lib/operational-logger";
import { getSafeErrorSummary } from "@/lib/safe-error";
import {
  deleteVerificationDocument,
  isVerificationObjectKey,
  listVerificationDocuments,
  type StoredVerificationDocument,
} from "@/lib/verification-storage";

const DAY_MS = 24 * 60 * 60 * 1000;

/** A request nobody reviewed for this long loses its document; the student can submit again. */
export const PENDING_VERIFICATION_RETENTION_MS = 60 * DAY_MS;

/** Objects younger than this are never treated as orphans: a submit is mid-flight. */
export const ORPHAN_GRACE_MS = DAY_MS;

/** Safety limits: a sweep that wants to delete more than this, or most of the bucket, is wrong. */
export const MAX_ORPHAN_DELETES_PER_RUN = 100;
export const ORPHAN_ABORT_MIN_CANDIDATES = 10;
export const ORPHAN_ABORT_RATIO = 0.5;

const MAX_EXPIRED_PER_RUN = 50;
const LOOKUP_CHUNK = 500;

export interface OrphanSelection {
  orphans: string[];
  candidates: number;
}

/**
 * Pure: which stored documents are not referenced by any account and old enough to be
 * sure. Throws when the result looks like a configuration mistake rather than leftovers,
 * for example a staging database pointed at the production bucket would make every
 * document look orphaned.
 */
export function selectOrphanKeys(
  documents: readonly StoredVerificationDocument[],
  referencedKeys: ReadonlySet<string>,
  nowMs = Date.now(),
): OrphanSelection {
  const candidates = documents.filter(({ lastModified }) => nowMs - lastModified.getTime() >= ORPHAN_GRACE_MS);
  const orphans = candidates.filter(({ key }) => !referencedKeys.has(key)).map(({ key }) => key);

  if (
    candidates.length >= ORPHAN_ABORT_MIN_CANDIDATES &&
    orphans.length / candidates.length > ORPHAN_ABORT_RATIO
  ) {
    throw new Error(
      `Orphan sweep aborted: ${orphans.length} of ${candidates.length} stored verification documents look unreferenced. Check that the database and bucket belong to the same environment.`,
    );
  }
  return { orphans: orphans.slice(0, MAX_ORPHAN_DELETES_PER_RUN), candidates: candidates.length };
}

async function findReferencedKeys(keys: readonly string[]): Promise<Set<string>> {
  const referenced = new Set<string>();
  for (let i = 0; i < keys.length; i += LOOKUP_CHUNK) {
    const chunk = keys.slice(i, i + LOOKUP_CHUNK);
    const [users, jobs] = await Promise.all([
      db.user.findMany({ where: { verificationDocUrl: { in: chunk } }, select: { verificationDocUrl: true } }),
      // An account-deletion job owns the object until its document phase finishes.
      db.accountDeletionJob.findMany({ where: { verificationObjectKey: { in: chunk } }, select: { verificationObjectKey: true } }),
    ]);
    for (const user of users) if (user.verificationDocUrl) referenced.add(user.verificationDocUrl);
    for (const job of jobs) if (job.verificationObjectKey) referenced.add(job.verificationObjectKey);
  }
  return referenced;
}

/**
 * Backstop for failed deletes: a decision, re-upload or account deletion removes the
 * document, but a storage error there is only logged. This removes anything in the
 * private bucket that no account references any more.
 */
export async function sweepOrphanedVerificationDocuments(nowMs = Date.now()): Promise<number> {
  const documents = await listVerificationDocuments();
  if (documents.length === 0) return 0;

  const referenced = await findReferencedKeys(documents.map(({ key }) => key));
  const { orphans } = selectOrphanKeys(documents, referenced, nowMs);

  let deleted = 0;
  for (const key of orphans) {
    await deleteVerificationDocument(key);
    deleted += 1;
  }
  if (deleted > 0) logOperationalEvent("warn", "verification.orphans_deleted", { count: deleted });
  return deleted;
}

/**
 * Pending requests that sat unreviewed past the retention period: delete the document,
 * return the student to "not submitted" and tell them. The file goes first so a storage
 * failure leaves the request intact for the next run.
 */
export async function expireStalePendingVerifications(nowMs = Date.now()): Promise<number> {
  const cutoff = new Date(nowMs - PENDING_VERIFICATION_RETENTION_MS);
  const stale = await db.user.findMany({
    where: {
      role: "STUDENT",
      verificationStatus: "PENDING",
      verificationDocUrl: { not: null },
      verificationSubmittedAt: { lt: cutoff },
    },
    select: { id: true, verificationDocUrl: true, verificationSubmittedAt: true },
    orderBy: { verificationSubmittedAt: "asc" },
    take: MAX_EXPIRED_PER_RUN,
  });

  let expired = 0;
  for (const user of stale) {
    const document = user.verificationDocUrl;
    try {
      if (document && isLegacyPublicDocumentUrl(document)) {
        await deleteLegacyPublicVerificationDocument(document);
      } else if (document && isVerificationObjectKey(document, user.id)) {
        await deleteVerificationDocument(document);
      }

      // Matching the submission time means a student who re-submitted meanwhile is left alone.
      const result = await db.user.updateMany({
        where: { id: user.id, verificationStatus: "PENDING", verificationSubmittedAt: user.verificationSubmittedAt },
        data: { verificationStatus: "NONE", verificationDocUrl: null, verificationSubmittedAt: null },
      });
      if (result.count !== 1) continue;

      expired += 1;
      await createNotification({
        userId: user.id,
        type: "STUDENT_VERIFICATION_REJECTED",
        title: "Verification request expired",
        message:
          "Your student verification was not reviewed within 60 days, so we deleted your document. Please submit it again to be verified.",
      });
    } catch (error) {
      const summary = getSafeErrorSummary(error);
      logOperationalEvent("error", "verification.expire_failed", {
        error_name: summary.name,
        error_code: summary.code ?? null,
      });
    }
  }
  return expired;
}
