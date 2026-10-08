-- CreateEnum
CREATE TYPE "RefundState" AS ENUM ('NONE', 'PROCESSING', 'UNCERTAIN', 'REFUNDED');

-- CreateEnum
CREATE TYPE "RefundAuditEventType" AS ENUM ('AUTOMATIC_REQUESTED', 'AUTOMATIC_CONFIRMED', 'AUTOMATIC_UNCERTAIN', 'MANUAL_CONFIRMED');

-- CreateEnum
CREATE TYPE "SafepayWebhookEventStatus" AS ENUM ('RECEIVED', 'QUEUED', 'PROCESSING', 'PROCESSED', 'RECONCILIATION_REQUIRED', 'IGNORED', 'RETRYABLE');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "refundState" "RefundState" NOT NULL DEFAULT 'NONE';

-- Preserve legacy refunds in the new authoritative refund state.
UPDATE "bookings"
SET "refundState" = 'REFUNDED'
WHERE "paymentStatus" = 'REFUNDED';

-- CreateTable
CREATE TABLE "refund_audit_events" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "type" "RefundAuditEventType" NOT NULL,
    "transactionId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "providerState" TEXT,
    "providerResponseDigest" TEXT,
    "failureName" TEXT,
    "failureCode" TEXT,
    "failureStatus" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refund_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safepay_webhook_events" (
    "id" TEXT NOT NULL,
    "bodyHash" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "merchantOrderId" TEXT,
    "tracker" TEXT,
    "providerState" TEXT,
    "amountMinorUnits" INTEGER,
    "currency" TEXT,
    "payloadEvidence" TEXT NOT NULL,
    "status" "SafepayWebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "processingAttempts" INTEGER NOT NULL DEFAULT 0,
    "processingStartedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safepay_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "refund_audit_events_bookingId_createdAt_idx" ON "refund_audit_events"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "refund_audit_events_attemptId_createdAt_idx" ON "refund_audit_events"("attemptId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "refund_audit_events_attemptId_type_key" ON "refund_audit_events"("attemptId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "safepay_webhook_events_bodyHash_key" ON "safepay_webhook_events"("bodyHash");

-- CreateIndex
CREATE INDEX "safepay_webhook_events_status_receivedAt_idx" ON "safepay_webhook_events"("status", "receivedAt");

-- CreateIndex
CREATE INDEX "safepay_webhook_events_merchantOrderId_receivedAt_idx" ON "safepay_webhook_events"("merchantOrderId", "receivedAt");

-- CreateIndex
CREATE INDEX "safepay_webhook_events_tracker_receivedAt_idx" ON "safepay_webhook_events"("tracker", "receivedAt");
