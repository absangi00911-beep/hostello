-- Migration: add cron_logs table
-- Tracks last run time and status of each cron job.

CREATE TABLE "cron_logs" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "ranAt"       TIMESTAMP(3) NOT NULL,
    "status"      TEXT NOT NULL,
    "durationMs"  INTEGER NOT NULL,
    "error"       TEXT,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cron_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cron_logs_name_key" ON "cron_logs"("name");
