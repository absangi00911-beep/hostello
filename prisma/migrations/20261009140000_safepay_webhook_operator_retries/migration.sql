-- Store each operator-authorized retry as an immutable record.
CREATE TABLE "safepay_webhook_replay_events" (
    "id" TEXT NOT NULL,
    "webhookEventId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "providerTracker" VARCHAR(256) NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safepay_webhook_replay_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "safepay_webhook_replay_events_reason_check"
        CHECK (char_length(btrim("reason")) BETWEEN 20 AND 500)
);

CREATE INDEX "safepay_webhook_replay_events_webhookEventId_createdAt_idx"
    ON "safepay_webhook_replay_events"("webhookEventId", "createdAt");
CREATE INDEX "safepay_webhook_replay_events_adminUserId_createdAt_idx"
    ON "safepay_webhook_replay_events"("adminUserId", "createdAt");

ALTER TABLE "safepay_webhook_replay_events"
    ADD CONSTRAINT "safepay_webhook_replay_events_webhookEventId_fkey"
    FOREIGN KEY ("webhookEventId") REFERENCES "safepay_webhook_events"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION "reject_safepay_webhook_replay_event_mutation"()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'safepay_webhook_replay_events is append-only';
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "safepay_webhook_replay_events_append_only"
    BEFORE UPDATE OR DELETE ON "safepay_webhook_replay_events"
    FOR EACH ROW EXECUTE FUNCTION "reject_safepay_webhook_replay_event_mutation"();

CREATE TRIGGER "safepay_webhook_replay_events_no_truncate"
    BEFORE TRUNCATE ON "safepay_webhook_replay_events"
    FOR EACH STATEMENT EXECUTE FUNCTION "reject_safepay_webhook_replay_event_mutation"();
