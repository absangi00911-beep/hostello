-- CreateEnum
CREATE TYPE "PayoutAuditAction" AS ENUM ('BATCH_CREATED', 'MARKED_PAID', 'VOIDED');

-- CreateTable
CREATE TABLE "payout_audit_events" (
    "id" TEXT NOT NULL,
    "payoutId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" "PayoutAuditAction" NOT NULL,
    "amount" INTEGER NOT NULL,
    "reference" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_audit_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payout_audit_events_amount_check" CHECK ("amount" >= 0),
    CONSTRAINT "payout_audit_events_transition_payload_check" CHECK (
        ("action" = 'BATCH_CREATED' AND "reference" IS NULL AND "reason" IS NULL)
        OR ("action" = 'MARKED_PAID' AND "reason" IS NULL)
        OR (
            "action" = 'VOIDED'
            AND "reference" IS NULL
            AND "reason" IS NOT NULL
            AND char_length(btrim("reason")) BETWEEN 10 AND 500
        )
    )
);

-- CreateIndex
CREATE INDEX "payout_audit_events_payoutId_createdAt_idx"
    ON "payout_audit_events"("payoutId", "createdAt");
CREATE INDEX "payout_audit_events_actorId_createdAt_idx"
    ON "payout_audit_events"("actorId", "createdAt");

-- AddForeignKey
ALTER TABLE "payout_audit_events"
    ADD CONSTRAINT "payout_audit_events_payoutId_fkey"
    FOREIGN KEY ("payoutId") REFERENCES "payouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill only facts already preserved by the payout records. The historical
-- payment reference may be null because older versions did not require one.
INSERT INTO "payout_audit_events" ("id", "payoutId", "actorId", "action", "amount", "createdAt")
SELECT 'payout-audit-created-' || "id", "id", "createdBy", 'BATCH_CREATED', "amount", "createdAt"
FROM "payouts";

INSERT INTO "payout_audit_events" ("id", "payoutId", "actorId", "action", "amount", "reference", "createdAt")
SELECT 'payout-audit-paid-' || "id", "id", "paidBy", 'MARKED_PAID', "amount", "reference", "paidAt"
FROM "payouts"
WHERE "status" = 'PAID' AND "paidBy" IS NOT NULL AND "paidAt" IS NOT NULL;

INSERT INTO "payout_audit_events" ("id", "payoutId", "actorId", "action", "amount", "reason", "createdAt")
SELECT 'payout-audit-voided-' || "id", "id", "cancelledBy", 'VOIDED', "amount", "cancellationReason", "cancelledAt"
FROM "payouts"
WHERE "status" = 'CANCELLED'
  AND "cancelledBy" IS NOT NULL
  AND "cancelledAt" IS NOT NULL
  AND char_length(btrim("cancellationReason")) BETWEEN 10 AND 500;

-- Make the event history append-only for normal database operations.
CREATE FUNCTION "reject_payout_audit_event_mutation"()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'payout_audit_events is append-only';
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "payout_audit_events_append_only"
    BEFORE UPDATE OR DELETE ON "payout_audit_events"
    FOR EACH ROW EXECUTE FUNCTION "reject_payout_audit_event_mutation"();

CREATE TRIGGER "payout_audit_events_no_truncate"
    BEFORE TRUNCATE ON "payout_audit_events"
    FOR EACH STATEMENT EXECUTE FUNCTION "reject_payout_audit_event_mutation"();
