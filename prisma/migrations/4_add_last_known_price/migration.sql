-- Add lastKnownPrice field to track actual previous price for accurate alerts
ALTER TABLE "price_alerts" ADD COLUMN "lastKnownPrice" DOUBLE PRECISION;
