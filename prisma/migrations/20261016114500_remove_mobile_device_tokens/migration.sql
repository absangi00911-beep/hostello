UPDATE "account_deletion_jobs"
SET "phase" = 'RESET_TOKENS'
WHERE "phase" = 'DEVICE_TOKENS';

DROP TABLE "device_tokens";
