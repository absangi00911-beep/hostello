-- First-party funnel analytics. One anonymous row per event: no user id, IP address or user
-- agent, and no foreign keys, so events never block deleting a hostel, booking or account.

CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sessionId" TEXT,
    "hostelId" TEXT,
    "bookingId" TEXT,
    "properties" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "analytics_events_name_createdAt_idx" ON "analytics_events"("name", "createdAt");
CREATE INDEX "analytics_events_bookingId_idx" ON "analytics_events"("bookingId");
CREATE INDEX "analytics_events_hostelId_name_idx" ON "analytics_events"("hostelId", "name");
CREATE INDEX "analytics_events_createdAt_idx" ON "analytics_events"("createdAt");
