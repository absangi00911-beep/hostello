CREATE TYPE "AvailabilityAlertType" AS ENUM ('HOSTEL', 'SEARCH');

ALTER TYPE "NotificationType" ADD VALUE 'AVAILABILITY_ALERT';

CREATE TABLE "availability_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AvailabilityAlertType" NOT NULL,
    "hostelId" TEXT,
    "searchCriteria" JSONB,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "guests" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "matched" BOOLEAN NOT NULL DEFAULT false,
    "matchVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_alerts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "availability_alerts_date_range_check" CHECK ("checkOut" > "checkIn"),
    CONSTRAINT "availability_alerts_guest_count_check" CHECK ("guests" BETWEEN 1 AND 4),
    CONSTRAINT "availability_alerts_criteria_check" CHECK (
      ("type" = 'HOSTEL' AND "hostelId" IS NOT NULL AND "searchCriteria" IS NULL)
      OR ("type" = 'SEARCH' AND "hostelId" IS NULL AND "searchCriteria" IS NOT NULL)
    )
);

ALTER TABLE "notifications"
  ADD COLUMN "availabilityAlertId" TEXT,
  ADD COLUMN "availabilityAlertTransition" INTEGER;

CREATE INDEX "availability_alerts_userId_active_checkIn_idx" ON "availability_alerts"("userId", "active", "checkIn");
CREATE INDEX "availability_alerts_hostelId_active_checkIn_idx" ON "availability_alerts"("hostelId", "active", "checkIn");
CREATE INDEX "notifications_availabilityAlertId_idx" ON "notifications"("availabilityAlertId");
CREATE UNIQUE INDEX "notifications_alert_transition_key" ON "notifications"("availabilityAlertId", "availabilityAlertTransition");

ALTER TABLE "availability_alerts" ADD CONSTRAINT "availability_alerts_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "availability_alerts" ADD CONSTRAINT "availability_alerts_hostelId_fkey"
  FOREIGN KEY ("hostelId") REFERENCES "hostels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_availabilityAlertId_fkey"
  FOREIGN KEY ("availabilityAlertId") REFERENCES "availability_alerts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
