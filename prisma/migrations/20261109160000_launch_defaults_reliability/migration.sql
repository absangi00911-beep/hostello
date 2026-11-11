-- Launch defaults: payout dual control, Pro renewal references, and a minimal
-- payment-confirmation email outbox. This migration is authored only; it has not
-- been applied to any database.

ALTER TYPE "PayoutStatus" ADD VALUE 'APPROVED';
ALTER TYPE "PayoutAuditAction" ADD VALUE 'APPROVED';

ALTER TABLE "payouts"
    ADD COLUMN "approvedAt" TIMESTAMP(3),
    ADD COLUMN "approvedBy" TEXT;
ALTER TABLE "payouts"
    ADD CONSTRAINT "payouts_approval_fields_check" CHECK (
        "status" <> 'APPROVED'
        OR (
            "approvedAt" IS NOT NULL
            AND "approvedBy" IS NOT NULL
            AND "approvedBy" <> "createdBy"
        )
    );

ALTER TABLE "payout_audit_events"
    DROP CONSTRAINT "payout_audit_events_transition_payload_check";
ALTER TABLE "payout_audit_events"
    ADD CONSTRAINT "payout_audit_events_transition_payload_check" CHECK (
        ("action" = 'BATCH_CREATED' AND "reference" IS NULL AND "reason" IS NULL)
        OR ("action" = 'APPROVED' AND "reference" IS NULL AND "reason" IS NULL)
        OR ("action" = 'MARKED_PAID' AND "reason" IS NULL)
        OR (
            "action" = 'VOIDED'
            AND "reference" IS NULL
            AND "reason" IS NOT NULL
            AND char_length(btrim("reason")) BETWEEN 10 AND 500
        )
    );

ALTER TABLE "subscriptions"
    ADD COLUMN "renewalPaymentRef" TEXT;

CREATE TYPE "PaymentEmailTemplate" AS ENUM (
    'BOOKING_REQUEST_EMAIL_TO_OWNER',
    'BOOKING_REQUEST_EMAIL_TO_STUDENT'
);
CREATE TYPE "PaymentEmailOutboxStatus" AS ENUM (
    'PENDING', 'PROCESSING', 'RETRY', 'SENT', 'DEAD'
);

CREATE TABLE "payment_email_outbox" (
    "id" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "template" "PaymentEmailTemplate" NOT NULL,
    "idempotencyKey" VARCHAR(160) NOT NULL,
    "status" "PaymentEmailOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAttemptAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastErrorCode" VARCHAR(48),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_email_outbox_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payment_email_outbox_attempt_count_check" CHECK ("attemptCount" >= 0),
    CONSTRAINT "payment_email_outbox_idempotency_key_key" UNIQUE ("idempotencyKey")
);

CREATE INDEX "payment_email_outbox_status_nextAttemptAt_idx"
    ON "payment_email_outbox"("status", "nextAttemptAt");
CREATE INDEX "payment_email_outbox_status_expiresAt_idx"
    ON "payment_email_outbox"("status", "expiresAt");

ALTER TABLE "payment_email_outbox"
    ADD CONSTRAINT "payment_email_outbox_recipientUserId_fkey"
        FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "payment_email_outbox_bookingId_fkey"
        FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
