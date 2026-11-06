CREATE TYPE "LatePaymentReason" AS ENUM ('ABANDONED_CHECKOUT', 'CANCELLED_WHILE_UNPAID');
CREATE TYPE "LatePaymentOutcome" AS ENUM ('REINSTATED', 'REFUND_REQUIRED');

CREATE TABLE "late_payment_resolutions" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "sourceWebhookEventId" TEXT NOT NULL,
    "providerTracker" TEXT NOT NULL,
    "reason" "LatePaymentReason" NOT NULL,
    "outcome" "LatePaymentOutcome" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "late_payment_resolutions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "late_payment_resolutions_amount_check" CHECK ("amount" > 0),
    CONSTRAINT "late_payment_resolutions_sourceWebhookEventId_key" UNIQUE ("sourceWebhookEventId"),
    CONSTRAINT "late_payment_resolutions_providerTracker_key" UNIQUE ("providerTracker"),
    CONSTRAINT "late_payment_resolutions_bookingId_fkey"
        FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "late_payment_resolutions_sourceWebhookEventId_fkey"
        FOREIGN KEY ("sourceWebhookEventId") REFERENCES "safepay_webhook_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "late_payment_resolutions_bookingId_recordedAt_idx"
    ON "late_payment_resolutions"("bookingId", "recordedAt");
CREATE INDEX "bookings_status_paymentStatus_refundState_updatedAt_idx"
    ON "bookings"("status", "paymentStatus", "refundState", "updatedAt");

CREATE FUNCTION "reject_immutable_financial_event_mutation"()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "refund_audit_events_append_only"
    BEFORE UPDATE OR DELETE ON "refund_audit_events"
    FOR EACH ROW EXECUTE FUNCTION "reject_immutable_financial_event_mutation"();
CREATE TRIGGER "refund_audit_events_no_truncate"
    BEFORE TRUNCATE ON "refund_audit_events"
    FOR EACH STATEMENT EXECUTE FUNCTION "reject_immutable_financial_event_mutation"();

CREATE TRIGGER "late_payment_resolutions_append_only"
    BEFORE UPDATE OR DELETE ON "late_payment_resolutions"
    FOR EACH ROW EXECUTE FUNCTION "reject_immutable_financial_event_mutation"();
CREATE TRIGGER "late_payment_resolutions_no_truncate"
    BEFORE TRUNCATE ON "late_payment_resolutions"
    FOR EACH STATEMENT EXECUTE FUNCTION "reject_immutable_financial_event_mutation"();
