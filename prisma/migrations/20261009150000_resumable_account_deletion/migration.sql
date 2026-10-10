ALTER TABLE "users"
ADD COLUMN "deletionRequestedAt" TIMESTAMP(3);

CREATE TABLE "account_deletion_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "subjectHash" VARCHAR(64) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "phase" TEXT NOT NULL DEFAULT 'NOTIFICATIONS',
    "cursor" TEXT,
    "retainsFinancialHistory" BOOLEAN NOT NULL DEFAULT false,
    "verificationObjectKey" VARCHAR(256),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastErrorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "account_deletion_jobs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "account_deletion_jobs_userId_key"
ON "account_deletion_jobs"("userId");

CREATE UNIQUE INDEX "account_deletion_jobs_subjectHash_key"
ON "account_deletion_jobs"("subjectHash");

CREATE INDEX "account_deletion_jobs_status_createdAt_idx"
ON "account_deletion_jobs"("status", "createdAt");
